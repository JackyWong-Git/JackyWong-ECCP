import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_session
from ..models import SkillAuditLog, SkillBinding, SkillInstallation, SkillPackage, SkillRelease, SkillSource
from ..security import InternalUser, get_internal_user, require_permission
from ..skill_discovery import DiscoveredSkill, SkillDiscoveryError, discover_github_skills, parse_github_url
from ..skill_schemas import (
    BusinessBindingInput,
    PreflightCheck,
    PreflightResponse,
    SkillAuditItem,
    SkillBindingItem,
    SkillBindingsUpdate,
    SkillDiscoverRequest,
    SkillDiscoverResponse,
    SkillInstallRequest,
    SkillInstallationItem,
    SkillInstallationUpdate,
    SkillItem,
    SkillList,
    SkillReleaseItem,
    SkillRollbackRequest,
    SkillSourceItem,
    SkillUpdateRequest,
)


router = APIRouter(prefix="/v1", tags=["skill-registry"])
Session = Annotated[AsyncSession, Depends(get_session)]
User = Annotated[InternalUser, Depends(get_internal_user)]


def _audit(
    session: AsyncSession,
    user: InternalUser,
    action: str,
    detail: str,
    *,
    skill: SkillPackage | None = None,
    source: SkillSource | None = None,
    audit_status: str = "success",
    metadata: dict | None = None,
) -> None:
    session.add(
        SkillAuditLog(
            skill_id=skill.id if skill else None,
            source_id=(source or (skill.source if skill else None)).id if (source or skill) else None,
            action=action,
            status=audit_status,
            detail=detail,
            event_metadata=metadata or {},
            actor_employee_id=user.employeeId,
            actor_name=user.displayName,
        )
    )


def _skill_options():
    return (
        selectinload(SkillPackage.source),
        selectinload(SkillPackage.releases),
        selectinload(SkillPackage.installation).selectinload(SkillInstallation.release),
        selectinload(SkillPackage.bindings),
    )


async def _load_skill(session: AsyncSession, skill_id: uuid.UUID) -> SkillPackage:
    skill = await session.scalar(
        select(SkillPackage)
        .where(SkillPackage.id == skill_id)
        .options(*_skill_options())
        .execution_options(populate_existing=True)
    )
    if not skill:
        raise HTTPException(status_code=404, detail="Skill 不存在")
    return skill


def _skill_item(skill: SkillPackage) -> SkillItem:
    installation = skill.installation
    installation_item = None
    installed_version = ""
    if installation:
        installed_version = installation.release.version
        installation_item = SkillInstallationItem(
            id=installation.id,
            release_id=installation.release_id,
            version=installed_version,
            status=installation.status,
            enabled=installation.enabled,
            preflight_status=installation.preflight_status,
            preflight_result=installation.preflight_result,
            config=installation.config,
            installed_by_name=installation.installed_by_name,
            installed_at=installation.installed_at,
            updated_at=installation.updated_at,
        )
    update_available = bool(installation and installed_version != skill.latest_version)
    item_status = "update" if update_available else "installed" if installation and installation.status == "active" else "available"
    return SkillItem(
        id=skill.id,
        source_id=skill.source_id,
        source_name=skill.source.name,
        repository_url=skill.source.repository_url,
        git_ref=skill.source.git_ref,
        slug=skill.slug,
        name=skill.name,
        description=skill.description,
        category=skill.category,
        author=skill.author,
        skill_path=skill.skill_path,
        homepage=skill.homepage,
        risk_level=skill.risk_level,
        risk_findings=skill.risk_findings,
        capabilities=skill.capabilities,
        required_env=skill.required_env,
        required_bins=skill.required_bins,
        suggested_businesses=skill.suggested_businesses,
        deprecated_by=skill.deprecated_by,
        latest_version=skill.latest_version,
        latest_commit_sha=skill.latest_commit_sha,
        status=item_status,
        update_available=update_available,
        installation=installation_item,
        bindings=[
            SkillBindingItem(
                id=binding.id,
                business_key=binding.business_key,
                business_name=binding.business_name,
                enabled=binding.enabled,
                config=binding.config,
            )
            for binding in sorted(skill.bindings, key=lambda item: item.business_name)
        ],
        releases=[
            SkillReleaseItem(
                id=release.id,
                version=release.version,
                commit_sha=release.commit_sha,
                checksum=release.checksum,
                discovered_at=release.discovered_at,
            )
            for release in sorted(skill.releases, key=lambda item: item.discovered_at, reverse=True)
        ],
        created_at=skill.created_at,
        updated_at=skill.updated_at,
    )


def _preflight(skill: SkillPackage) -> PreflightResponse:
    checks: list[PreflightCheck] = [
        PreflightCheck(key="manifest", label="Skill 清单", status="passed", detail="SKILL.md 已解析并生成 SHA-256 摘要。"),
        PreflightCheck(
            key="risk",
            label="风险识别",
            status="warning" if skill.risk_level == "high" else "passed",
            detail=f"识别为{ {'low': '低', 'medium': '中', 'high': '高'}[skill.risk_level] }风险能力。",
        ),
    ]
    binaries_ready = True
    if skill.required_bins:
        available = [binary for binary in skill.required_bins if shutil.which(binary)]
        binaries_ready = bool(available)
        checks.append(
            PreflightCheck(
                key="runtime",
                label="运行环境",
                status="passed" if binaries_ready else "failed",
                detail=f"可用运行时：{'、'.join(available)}" if available else f"需安装任一运行时：{'、'.join(skill.required_bins)}",
            )
        )
    if skill.required_env:
        configured = [name for name in skill.required_env if os.getenv(name)]
        missing = [name for name in skill.required_env if name not in configured]
        checks.append(
            PreflightCheck(
                key="credentials",
                label="凭据配置",
                status="passed" if not missing else "warning",
                detail="所需环境变量已配置。" if not missing else f"启用前还需配置：{'、'.join(missing)}",
            )
        )
    overall = "failed" if not binaries_ready else "warning" if any(item.status == "warning" for item in checks) else "passed"
    return PreflightResponse(
        status=overall,
        checks=checks,
        risk_level=skill.risk_level,
        ready_for_install=binaries_ready,
    )


async def _upsert_bindings(session: AsyncSession, skill: SkillPackage, bindings: list[BusinessBindingInput]) -> None:
    existing = {item.business_key: item for item in skill.bindings}
    requested = {item.business_key: item for item in bindings}
    for key, binding in existing.items():
        if key not in requested:
            await session.delete(binding)
    for key, payload in requested.items():
        binding = existing.get(key)
        if binding:
            binding.business_name = payload.business_name
            binding.enabled = payload.enabled
            binding.config = payload.config
        else:
            session.add(SkillBinding(skill_id=skill.id, **payload.model_dump()))


async def _store_discovered(
    session: AsyncSession,
    user: InternalUser,
    discovered: list[DiscoveredSkill],
) -> tuple[list[uuid.UUID], int]:
    first = discovered[0]
    source = await session.scalar(
        select(SkillSource).where(
            SkillSource.repository_url == first.repository_url,
            SkillSource.git_ref == first.git_ref,
        )
    )
    now = datetime.now(timezone.utc)
    if not source:
        source = SkillSource(
            name=f"{first.owner}/{first.repository}",
            repository_url=first.repository_url,
            owner=first.owner,
            repository=first.repository,
            git_ref=first.git_ref,
            created_by_employee_id=user.employeeId,
            created_by_name=user.displayName,
        )
        session.add(source)
        await session.flush()
    source.status = "active"
    source.enabled = True
    source.last_scanned_at = now
    skill_ids: list[uuid.UUID] = []
    new_releases = 0
    for candidate in discovered:
        skill = await session.scalar(
            select(SkillPackage)
            .where(SkillPackage.source_id == source.id, SkillPackage.skill_path == candidate.skill_path)
            .options(selectinload(SkillPackage.releases), selectinload(SkillPackage.source))
        )
        if not skill:
            skill = SkillPackage(
                source_id=source.id,
                source=source,
                slug=candidate.name,
                name=candidate.name,
                skill_path=candidate.skill_path,
                releases=[],
            )
            session.add(skill)
            await session.flush()
        skill.slug = candidate.name
        skill.name = candidate.name
        skill.description = candidate.description
        skill.category = candidate.category
        skill.author = candidate.author
        skill.homepage = candidate.homepage
        skill.risk_level = candidate.risk_level
        skill.risk_findings = candidate.risk_findings
        skill.capabilities = candidate.capabilities
        skill.required_env = candidate.required_env
        skill.required_bins = candidate.required_bins
        skill.suggested_businesses = candidate.suggested_businesses
        skill.deprecated_by = candidate.deprecated_by
        skill.latest_version = candidate.version
        skill.latest_commit_sha = candidate.commit_sha
        skill.manifest = candidate.to_manifest()
        release = next((item for item in skill.releases if item.checksum == candidate.checksum), None)
        if not release:
            session.add(
                SkillRelease(
                    skill_id=skill.id,
                    version=candidate.version,
                    commit_sha=candidate.commit_sha,
                    checksum=candidate.checksum,
                    manifest=candidate.to_manifest(),
                )
            )
            new_releases += 1
        skill_ids.append(skill.id)
        _audit(
            session,
            user,
            "discovered",
            f"从 GitHub 发现 {candidate.name} v{candidate.version}",
            skill=skill,
            source=source,
            audit_status="warning" if candidate.risk_level == "high" else "success",
            metadata={"risk_level": candidate.risk_level, "checksum": candidate.checksum},
        )
    await session.commit()
    return skill_ids, new_releases


@router.get("/skill-sources", response_model=list[SkillSourceItem])
async def list_sources(session: Session, user: User) -> list[SkillSourceItem]:
    require_permission(user, "accounts.manage_platform")
    sources = (await session.scalars(select(SkillSource).order_by(SkillSource.updated_at.desc()))).all()
    return [SkillSourceItem.model_validate(item, from_attributes=True) for item in sources]


@router.post("/skills/discover", response_model=SkillDiscoverResponse)
async def discover_skills(payload: SkillDiscoverRequest, session: Session, user: User) -> SkillDiscoverResponse:
    require_permission(user, "accounts.manage_platform")
    try:
        discovered = await discover_github_skills(payload.url)
    except SkillDiscoveryError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    skill_ids, new_releases = await _store_discovered(session, user, discovered)
    items = (
        await session.scalars(
            select(SkillPackage).where(SkillPackage.id.in_(skill_ids)).options(*_skill_options()).order_by(SkillPackage.name)
        )
    ).all()
    return SkillDiscoverResponse(items=[_skill_item(item) for item in items], discovered=len(items), new_releases=new_releases)


@router.get("/skills", response_model=SkillList)
async def list_skills(
    session: Session,
    user: User,
    q: str = Query(default="", max_length=120),
    skill_status: str = Query(default="", alias="status", pattern="^(|available|installed|update)$"),
    business: str = Query(default="", max_length=80),
    risk: str = Query(default="", pattern="^(|low|medium|high)$"),
) -> SkillList:
    require_permission(user, "accounts.manage_platform")
    filters = []
    if q:
        pattern = f"%{q}%"
        filters.append(or_(SkillPackage.name.ilike(pattern), SkillPackage.description.ilike(pattern)))
    if risk:
        filters.append(SkillPackage.risk_level == risk)
    if business:
        filters.append(SkillPackage.bindings.any(SkillBinding.business_key == business))
    skills = (
        await session.scalars(select(SkillPackage).where(*filters).options(*_skill_options()).order_by(SkillPackage.updated_at.desc()))
    ).all()
    items = [_skill_item(item) for item in skills]
    if skill_status:
        items = [item for item in items if item.status == skill_status]
    return SkillList(items=items, total=len(items))


@router.get("/skills/{skill_id}", response_model=SkillItem)
async def get_skill(skill_id: uuid.UUID, session: Session, user: User) -> SkillItem:
    require_permission(user, "accounts.manage_platform")
    return _skill_item(await _load_skill(session, skill_id))


@router.post("/skills/{skill_id}/preflight", response_model=PreflightResponse)
async def preflight_skill(skill_id: uuid.UUID, session: Session, user: User) -> PreflightResponse:
    require_permission(user, "accounts.manage_platform")
    skill = await _load_skill(session, skill_id)
    result = _preflight(skill)
    _audit(
        session,
        user,
        "preflight",
        f"预检结果：{result.status}",
        skill=skill,
        audit_status="success" if result.status == "passed" else "warning" if result.status == "warning" else "failed",
        metadata=result.model_dump(),
    )
    await session.commit()
    return result


@router.post("/skills/{skill_id}/install", response_model=SkillItem)
async def install_skill(skill_id: uuid.UUID, payload: SkillInstallRequest, session: Session, user: User) -> SkillItem:
    require_permission(user, "accounts.manage_platform")
    skill = await _load_skill(session, skill_id)
    if skill.risk_level == "high" and not payload.accept_risk:
        raise HTTPException(status_code=409, detail="高风险 Skill 需要确认风险后才能安装")
    release = None
    if payload.release_id:
        release = next((item for item in skill.releases if item.id == payload.release_id), None)
    else:
        release = next((item for item in skill.releases if item.version == skill.latest_version), None)
    if not release:
        raise HTTPException(status_code=404, detail="可安装版本不存在")
    preflight = _preflight(skill)
    if not preflight.ready_for_install:
        raise HTTPException(status_code=409, detail="运行环境预检未通过，请先补齐依赖")
    if skill.installation:
        skill.installation.release_id = release.id
        skill.installation.release = release
        skill.installation.status = "active"
        skill.installation.enabled = True
        skill.installation.config = payload.config
        skill.installation.preflight_status = preflight.status
        skill.installation.preflight_result = preflight.model_dump()
    else:
        session.add(
            SkillInstallation(
                skill_id=skill.id,
                release_id=release.id,
                status="active",
                enabled=True,
                preflight_status=preflight.status,
                preflight_result=preflight.model_dump(),
                config=payload.config,
                installed_by_employee_id=user.employeeId,
                installed_by_name=user.displayName,
            )
        )
    await _upsert_bindings(session, skill, payload.bindings)
    _audit(session, user, "installed", f"安装 {skill.name} v{release.version}", skill=skill, metadata={"release_id": str(release.id)})
    await session.commit()
    return _skill_item(await _load_skill(session, skill_id))


@router.patch("/skills/{skill_id}/installation", response_model=SkillItem)
async def update_installation(
    skill_id: uuid.UUID, payload: SkillInstallationUpdate, session: Session, user: User
) -> SkillItem:
    require_permission(user, "accounts.manage_platform")
    skill = await _load_skill(session, skill_id)
    if not skill.installation:
        raise HTTPException(status_code=404, detail="Skill 尚未安装")
    if payload.enabled is not None:
        skill.installation.enabled = payload.enabled
    if payload.config is not None:
        skill.installation.config = payload.config
    _audit(session, user, "installation_updated", f"更新 {skill.name} 的启用与配置状态", skill=skill)
    await session.commit()
    return _skill_item(await _load_skill(session, skill_id))


@router.delete("/skills/{skill_id}/installation", status_code=status.HTTP_204_NO_CONTENT)
async def uninstall_skill(skill_id: uuid.UUID, session: Session, user: User) -> None:
    require_permission(user, "accounts.manage_platform")
    skill = await _load_skill(session, skill_id)
    if not skill.installation:
        return
    await session.delete(skill.installation)
    for binding in skill.bindings:
        await session.delete(binding)
    _audit(session, user, "uninstalled", f"卸载 {skill.name} 并解除业务绑定", skill=skill)
    await session.commit()


@router.put("/skills/{skill_id}/bindings", response_model=SkillItem)
async def update_bindings(skill_id: uuid.UUID, payload: SkillBindingsUpdate, session: Session, user: User) -> SkillItem:
    require_permission(user, "accounts.manage_platform")
    skill = await _load_skill(session, skill_id)
    if not skill.installation:
        raise HTTPException(status_code=409, detail="请先安装 Skill，再绑定业务")
    await _upsert_bindings(session, skill, payload.bindings)
    _audit(session, user, "bindings_updated", f"更新 {skill.name} 的业务绑定", skill=skill)
    await session.commit()
    return _skill_item(await _load_skill(session, skill_id))


@router.post("/skills/{skill_id}/update-check", response_model=SkillItem)
async def check_update(skill_id: uuid.UUID, session: Session, user: User) -> SkillItem:
    require_permission(user, "accounts.manage_platform")
    skill = await _load_skill(session, skill_id)
    url = f"{skill.source.repository_url}/tree/{skill.source.git_ref}/{skill.skill_path}"
    try:
        discovered = await discover_github_skills(url)
    except SkillDiscoveryError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    await _store_discovered(session, user, discovered)
    refreshed = await _load_skill(session, skill_id)
    _audit(session, user, "update_checked", f"检查 {skill.name} 的上游版本", skill=refreshed)
    await session.commit()
    return _skill_item(await _load_skill(session, skill_id))


@router.post("/skills/{skill_id}/update", response_model=SkillItem)
async def update_skill(skill_id: uuid.UUID, payload: SkillUpdateRequest, session: Session, user: User) -> SkillItem:
    require_permission(user, "accounts.manage_platform")
    skill = await _load_skill(session, skill_id)
    if not skill.installation:
        raise HTTPException(status_code=409, detail="Skill 尚未安装")
    if skill.risk_level == "high" and not payload.accept_risk:
        raise HTTPException(status_code=409, detail="高风险更新需要再次确认")
    release = next((item for item in skill.releases if item.version == skill.latest_version), None)
    if not release:
        raise HTTPException(status_code=404, detail="最新版本记录不存在")
    previous_version = skill.installation.release.version
    skill.installation.release_id = release.id
    skill.installation.release = release
    _audit(
        session,
        user,
        "updated",
        f"{skill.name} 从 v{previous_version} 更新到 v{release.version}",
        skill=skill,
        metadata={"from": previous_version, "to": release.version},
    )
    await session.commit()
    return _skill_item(await _load_skill(session, skill_id))


@router.post("/skills/{skill_id}/rollback", response_model=SkillItem)
async def rollback_skill(skill_id: uuid.UUID, payload: SkillRollbackRequest, session: Session, user: User) -> SkillItem:
    require_permission(user, "accounts.manage_platform")
    skill = await _load_skill(session, skill_id)
    if not skill.installation:
        raise HTTPException(status_code=409, detail="Skill 尚未安装")
    if skill.risk_level == "high" and not payload.accept_risk:
        raise HTTPException(status_code=409, detail="高风险 Skill 回退需要确认")
    release = next((item for item in skill.releases if item.id == payload.release_id), None)
    if not release:
        raise HTTPException(status_code=404, detail="回退版本不存在")
    previous_version = skill.installation.release.version
    skill.installation.release_id = release.id
    skill.installation.release = release
    _audit(
        session,
        user,
        "rolled_back",
        f"{skill.name} 从 v{previous_version} 回退到 v{release.version}",
        skill=skill,
        metadata={"from": previous_version, "to": release.version},
    )
    await session.commit()
    return _skill_item(await _load_skill(session, skill_id))


@router.get("/skill-audit-logs", response_model=list[SkillAuditItem])
async def list_audit_logs(
    session: Session,
    user: User,
    skill_id: uuid.UUID | None = None,
    limit: int = Query(default=60, ge=1, le=200),
) -> list[SkillAuditItem]:
    require_permission(user, "accounts.manage_platform")
    query = select(SkillAuditLog).options(selectinload(SkillAuditLog.skill)).order_by(SkillAuditLog.created_at.desc()).limit(limit)
    if skill_id:
        query = query.where(SkillAuditLog.skill_id == skill_id)
    logs = (await session.scalars(query)).all()
    return [
        SkillAuditItem(
            id=log.id,
            skill_id=log.skill_id,
            source_id=log.source_id,
            skill_name=log.skill.name if log.skill else "已删除 Skill",
            action=log.action,
            status=log.status,
            detail=log.detail,
            event_metadata=log.event_metadata,
            actor_name=log.actor_name,
            created_at=log.created_at,
        )
        for log in logs
    ]
