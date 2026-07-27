import math
import re
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..agent_schemas import (
    AgentCreate,
    AgentItem,
    AgentKnowledgeItem,
    AgentKnowledgeBindingsUpdate,
    AgentList,
    AgentRunComplete,
    AgentRunCreate,
    AgentRunItem,
    AgentRunList,
    AgentUpdate,
    AgentSkillItem,
    AgentSkillBindingsUpdate,
    AgentVersionCreate,
    AgentVersionItem,
    ApprovalDecision,
    ApprovalItem,
    RunStepItem,
)
from ..config import get_settings
from ..database import get_session
from ..embeddings import embed_texts
from ..models import (
    Agent,
    AgentKnowledgeBinding,
    AgentRun,
    AgentSkillBinding,
    AgentVersion,
    Approval,
    Document,
    DocumentChunk,
    RunStep,
    SkillBinding,
    SkillInstallation,
    SkillPackage,
)
from ..security import InternalUser, get_internal_user, require_permission


router = APIRouter(prefix="/v1", tags=["agent-runtime"])
Session = Annotated[AsyncSession, Depends(get_session)]
User = Annotated[InternalUser, Depends(get_internal_user)]

BUSINESS_PATTERNS = {
    "wechat": ("公众号", "微信", "推文"),
    "xiaohongshu": ("小红书", "红书", "图卡"),
    "video": ("视频号", "视频", "分镜", "脚本"),
    "website": ("官网", "网站", "网页"),
    "story": ("员工故事", "采访素材", "人物故事", "成长故事"),
    "material": ("素材", "报送", "上报", "初筛"),
    "review": ("审核", "合规", "敏感词", "校对"),
    "topic": ("选题", "热点", "趋势", "策划"),
    "analytics": ("复盘", "数据", "指标", "效果"),
}
HIGH_RISK_ACTION = re.compile(r"发布|发送|推送|上线|群发|提交到")


def _require_any(user: InternalUser, *permissions: str) -> None:
    if not any(user.has_permission(permission) for permission in permissions):
        require_permission(user, permissions[0])


def _agent_options():
    return (
        selectinload(Agent.versions),
        selectinload(Agent.skill_bindings).selectinload(AgentSkillBinding.skill).selectinload(SkillPackage.installation).selectinload(SkillInstallation.release),
        selectinload(Agent.skill_bindings).selectinload(AgentSkillBinding.skill).selectinload(SkillPackage.bindings),
        selectinload(Agent.knowledge_bindings).selectinload(AgentKnowledgeBinding.knowledge_base),
    )


def _run_options():
    return (
        selectinload(AgentRun.agent),
        selectinload(AgentRun.agent_version),
        selectinload(AgentRun.steps),
        selectinload(AgentRun.approval),
    )


async def _load_agent(session: AsyncSession, agent_id: uuid.UUID) -> Agent:
    agent = await session.scalar(
        select(Agent)
        .where(Agent.id == agent_id)
        .options(*_agent_options())
        .execution_options(populate_existing=True)
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent 不存在")
    return agent


async def _load_run(session: AsyncSession, run_id: uuid.UUID) -> AgentRun:
    run = await session.scalar(
        select(AgentRun)
        .where(AgentRun.id == run_id)
        .options(*_run_options())
        .execution_options(populate_existing=True)
    )
    if not run:
        raise HTTPException(status_code=404, detail="运行记录不存在")
    return run


def _current_version(agent: Agent) -> AgentVersion:
    version = next((item for item in agent.versions if item.version == agent.current_version), None)
    if not version:
        raise HTTPException(status_code=409, detail="Agent 当前版本不存在")
    return version


def _agent_item(agent: Agent) -> AgentItem:
    version = _current_version(agent)
    return AgentItem(
        id=agent.id,
        slug=agent.slug,
        name=agent.name,
        description=agent.description,
        category=agent.category,
        status=agent.status,
        model_id=agent.model_id,
        routing_keywords=agent.routing_keywords,
        business_keys=agent.business_keys,
        current_version=agent.current_version,
        current_prompt=version.system_prompt,
        run_count=agent.run_count,
        success_count=agent.success_count,
        success_rate=round(agent.success_count / agent.run_count * 100, 1) if agent.run_count else 0,
        last_run_at=agent.last_run_at,
        skill_bindings=[
            AgentSkillItem(
                id=binding.id,
                skill_id=binding.skill_id,
                name=binding.skill.name,
                slug=binding.skill.slug,
                version=binding.skill.installation.release.version if binding.skill.installation else binding.skill.latest_version,
                risk_level=binding.skill.risk_level,
                enabled=binding.enabled,
                required=binding.required,
                regression_status=binding.regression_status,
                suggested_businesses=binding.skill.suggested_businesses,
            )
            for binding in sorted(agent.skill_bindings, key=lambda item: item.skill.name)
        ],
        knowledge_bindings=[
            AgentKnowledgeItem(
                id=binding.id,
                knowledge_base_id=binding.knowledge_base_id,
                name=binding.knowledge_base.name,
                enabled=binding.enabled,
                top_k=binding.top_k,
            )
            for binding in sorted(agent.knowledge_bindings, key=lambda item: item.knowledge_base.name)
        ],
        created_at=agent.created_at,
        updated_at=agent.updated_at,
    )


def _run_item(run: AgentRun) -> AgentRunItem:
    return AgentRunItem(
        id=run.id,
        agent_id=run.agent_id,
        agent_name=run.agent.name,
        agent_status=run.agent.status,
        agent_version=run.agent_version.version,
        system_prompt=run.agent_version.system_prompt,
        source=run.source,
        input_text=run.input_text,
        output_text=run.output_text,
        business_key=run.business_key,
        status=run.status,
        route_reason=run.route_reason,
        model_id=run.model_id,
        conversation_id=run.conversation_id,
        error_message=run.error_message,
        requested_by_name=run.requested_by_name,
        started_at=run.started_at,
        completed_at=run.completed_at,
        created_at=run.created_at,
        steps=[
            RunStepItem(
                id=step.id,
                ordinal=step.ordinal,
                step_type=step.step_type,
                name=step.name,
                status=step.status,
                skill_id=step.skill_id,
                knowledge_base_id=step.knowledge_base_id,
                input_summary=step.input_summary,
                output_summary=step.output_summary,
                metadata=step.step_metadata,
                started_at=step.started_at,
                completed_at=step.completed_at,
            )
            for step in sorted(run.steps, key=lambda item: item.ordinal)
        ],
        approval=ApprovalItem(
            id=run.approval.id,
            approval_type=run.approval.approval_type,
            status=run.approval.status,
            reason=run.approval.reason,
            requested_by_name=run.approval.requested_by_name,
            reviewed_by_name=run.approval.reviewed_by_name,
            review_note=run.approval.review_note,
            reviewed_at=run.approval.reviewed_at,
            created_at=run.approval.created_at,
        ) if run.approval else None,
    )


def _business_for(text: str) -> str:
    for key, patterns in BUSINESS_PATTERNS.items():
        if any(pattern in text for pattern in patterns):
            return key
    return "general"


async def _route_agent(session: AsyncSession, text: str, business_key: str, explicit_id: uuid.UUID | None) -> tuple[Agent, str]:
    if explicit_id:
        agent = await _load_agent(session, explicit_id)
        if agent.status == "inactive":
            raise HTTPException(status_code=409, detail="所选 Agent 已暂停")
        return agent, "用户明确指定该 Agent"
    agents = (await session.scalars(select(Agent).where(Agent.status.in_(["active", "retest"])).options(*_agent_options()))).unique().all()
    if not agents:
        raise HTTPException(status_code=409, detail="没有可用 Agent")
    scored = []
    for agent in agents:
        score = 5 if business_key in agent.business_keys else 0
        score += sum(2 for keyword in agent.routing_keywords if keyword and keyword in text)
        scored.append((score, agent))
    score, agent = max(scored, key=lambda item: (item[0], item[1].slug == "employee-story"))
    reason = f"识别为 {business_key} 场景，命中 {score} 分路由规则" if score else "未命中特定规则，交由通用内容 Agent 承接"
    return agent, reason


async def _retrieve_context(session: AsyncSession, binding: AgentKnowledgeBinding, query: str) -> list[dict]:
    vector = (await embed_texts([query]))[0]
    settings = get_settings()
    if settings.is_sqlite:
        rows = (await session.execute(
            select(DocumentChunk, Document.name).join(Document, Document.id == DocumentChunk.document_id).where(DocumentChunk.knowledge_base_id == binding.knowledge_base_id)
        )).all()
        def cosine(values: list[float]) -> float:
            denominator = math.sqrt(sum(value * value for value in values)) or 1.0
            return sum(left * right for left, right in zip(vector, values, strict=True)) / denominator
        ranked = sorted(((chunk, name, cosine(chunk.embedding)) for chunk, name in rows), key=lambda item: item[2], reverse=True)[:binding.top_k]
    else:
        distance = DocumentChunk.embedding.cosine_distance(vector)
        rows = (await session.execute(
            select(DocumentChunk, Document.name, (1 - distance).label("score"))
            .join(Document, Document.id == DocumentChunk.document_id)
            .where(DocumentChunk.knowledge_base_id == binding.knowledge_base_id)
            .order_by(distance).limit(binding.top_k)
        )).all()
        ranked = [(chunk, name, float(score)) for chunk, name, score in rows]
    return [{"document": name, "content": chunk.content[:1200], "score": round(max(0.0, min(1.0, score)), 3)} for chunk, name, score in ranked]


@router.get("/agents", response_model=AgentList)
async def list_agents(session: Session, user: User) -> AgentList:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    agents = (await session.scalars(select(Agent).options(*_agent_options()).order_by(Agent.created_at))).unique().all()
    return AgentList(items=[_agent_item(agent) for agent in agents], total=len(agents))


@router.post("/agents", response_model=AgentItem, status_code=status.HTTP_201_CREATED)
async def create_agent(payload: AgentCreate, session: Session, user: User) -> AgentItem:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    slug = f"custom-{uuid.uuid4().hex[:12]}"
    agent = Agent(slug=slug, name=payload.name, description=payload.description, category=payload.category, model_id=payload.model_id, routing_keywords=payload.routing_keywords, business_keys=payload.business_keys, status="draft", created_by_employee_id=user.employeeId, created_by_name=user.displayName)
    session.add(agent)
    await session.flush()
    session.add(AgentVersion(agent_id=agent.id, version=1, system_prompt=payload.system_prompt, config={}, change_note="创建 Agent", created_by_employee_id=user.employeeId, created_by_name=user.displayName))
    await session.commit()
    return _agent_item(await _load_agent(session, agent.id))


@router.patch("/agents/{agent_id}", response_model=AgentItem)
async def update_agent(agent_id: uuid.UUID, payload: AgentUpdate, session: Session, user: User) -> AgentItem:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    agent = await _load_agent(session, agent_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(agent, key, value)
    await session.commit()
    return _agent_item(await _load_agent(session, agent.id))


@router.post("/agents/{agent_id}/versions", response_model=AgentItem)
async def create_agent_version(agent_id: uuid.UUID, payload: AgentVersionCreate, session: Session, user: User) -> AgentItem:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    agent = await _load_agent(session, agent_id)
    agent.current_version += 1
    session.add(AgentVersion(agent_id=agent.id, version=agent.current_version, system_prompt=payload.system_prompt, config=payload.config, change_note=payload.change_note, created_by_employee_id=user.employeeId, created_by_name=user.displayName))
    await session.commit()
    return _agent_item(await _load_agent(session, agent.id))


@router.put("/agents/{agent_id}/skills", response_model=AgentItem)
async def update_agent_skills(agent_id: uuid.UUID, payload: AgentSkillBindingsUpdate, session: Session, user: User) -> AgentItem:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    agent = await _load_agent(session, agent_id)
    requested = {item.skill_id: item for item in payload.bindings}
    installed = {skill.id: skill for skill in (await session.scalars(select(SkillPackage).join(SkillInstallation).where(SkillInstallation.status == "active"))).all()}
    if missing := set(requested) - set(installed):
        raise HTTPException(status_code=409, detail=f"有 {len(missing)} 个 Skill 未安装")
    existing = {binding.skill_id: binding for binding in agent.skill_bindings}
    for skill_id, binding in existing.items():
        if skill_id not in requested:
            await session.delete(binding)
    for skill_id, item in requested.items():
        binding = existing.get(skill_id)
        if binding:
            binding.enabled = item.enabled
            binding.required = item.required
        else:
            session.add(AgentSkillBinding(agent_id=agent.id, skill_id=skill_id, enabled=item.enabled, required=item.required, regression_status="passed", bound_version=installed[skill_id].latest_version))
    await session.commit()
    return _agent_item(await _load_agent(session, agent.id))


@router.put("/agents/{agent_id}/knowledge-bases", response_model=AgentItem)
async def update_agent_knowledge(agent_id: uuid.UUID, payload: AgentKnowledgeBindingsUpdate, session: Session, user: User) -> AgentItem:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    agent = await _load_agent(session, agent_id)
    requested = {item.knowledge_base_id: item for item in payload.bindings}
    existing = {binding.knowledge_base_id: binding for binding in agent.knowledge_bindings}
    for kb_id, binding in existing.items():
        if kb_id not in requested:
            await session.delete(binding)
    for kb_id, item in requested.items():
        binding = existing.get(kb_id)
        if binding:
            binding.enabled = item.enabled
            binding.top_k = item.top_k
        else:
            session.add(AgentKnowledgeBinding(agent_id=agent.id, knowledge_base_id=kb_id, enabled=item.enabled, top_k=item.top_k))
    await session.commit()
    return _agent_item(await _load_agent(session, agent.id))


@router.post("/agent-runs", response_model=AgentRunItem, status_code=status.HTTP_201_CREATED)
async def create_agent_run(payload: AgentRunCreate, session: Session, user: User) -> AgentRunItem:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    business = payload.business_key or _business_for(payload.input_text)
    agent, reason = await _route_agent(session, payload.input_text, business, payload.agent_id)
    version = _current_version(agent)
    now = datetime.now(timezone.utc)
    run = AgentRun(agent_id=agent.id, agent_version_id=version.id, source=payload.source, input_text=payload.input_text, business_key=business, route_reason=reason, model_id=agent.model_id, conversation_id=payload.conversation_id, requested_by_employee_id=user.employeeId, requested_by_name=user.displayName)
    session.add(run)
    await session.flush()
    ordinal = 1
    session.add(RunStep(run_id=run.id, ordinal=ordinal, step_type="route", name="任务路由", status="completed", output_summary=f"{agent.name}：{reason}", started_at=now, completed_at=now))
    ordinal += 1
    if payload.knowledge_enabled and any(binding.enabled for binding in agent.knowledge_bindings):
        for binding in agent.knowledge_bindings:
            if not binding.enabled:
                continue
            snippets = await _retrieve_context(session, binding, payload.input_text)
            session.add(RunStep(run_id=run.id, ordinal=ordinal, step_type="rag", name=f"检索 {binding.knowledge_base.name}", status="completed", knowledge_base_id=binding.knowledge_base_id, output_summary=f"命中 {len(snippets)} 个知识片段", step_metadata={"references": snippets}, started_at=now, completed_at=now))
            ordinal += 1
    else:
        session.add(RunStep(run_id=run.id, ordinal=ordinal, step_type="rag", name="RAG 知识检索", status="skipped", output_summary="当前 Agent 未绑定知识库或本次已关闭检索", started_at=now, completed_at=now))
        ordinal += 1

    high_risk_skills = []
    for binding in agent.skill_bindings:
        skill = binding.skill
        installation = skill.installation
        relevant = business in skill.suggested_businesses or any(item.business_key == business and item.enabled for item in skill.bindings)
        if not binding.enabled or not installation or not installation.enabled or not relevant:
            continue
        requires_approval = skill.risk_level == "high" and bool(HIGH_RISK_ACTION.search(payload.input_text))
        session.add(RunStep(run_id=run.id, ordinal=ordinal, step_type="skill", name=skill.name, status="blocked" if requires_approval else "completed", skill_id=skill.id, output_summary="等待人工批准后进入受控执行队列" if requires_approval else f"已解析 Skill v{installation.release.version} 的能力契约", step_metadata={"risk_level": skill.risk_level, "version": installation.release.version, "execution": "approval_required" if requires_approval else "resolved"}, started_at=now, completed_at=None if requires_approval else now))
        ordinal += 1
        if requires_approval:
            high_risk_skills.append(skill.name)
    session.add(RunStep(run_id=run.id, ordinal=ordinal, step_type="model", name="模型生成", status="running", input_summary=f"使用 {agent.model_id}", started_at=now))
    if high_risk_skills:
        session.add(Approval(run_id=run.id, reason=f"将调用高风险发布能力：{'、'.join(high_risk_skills)}。批准只会进入受控执行队列。", requested_by_employee_id=user.employeeId, requested_by_name=user.displayName))
    await session.commit()
    return _run_item(await _load_run(session, run.id))


@router.post("/agent-runs/{run_id}/complete", response_model=AgentRunItem)
async def complete_agent_run(run_id: uuid.UUID, payload: AgentRunComplete, session: Session, user: User) -> AgentRunItem:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    run = await _load_run(session, run_id)
    if run.requested_by_employee_id != user.employeeId and not user.has_permission("accounts.manage_platform"):
        raise HTTPException(status_code=403, detail="不能完成其他用户的运行")
    if run.status not in {"running", "failed"}:
        return _run_item(run)
    now = datetime.now(timezone.utc)
    run.output_text = payload.output_text
    run.error_message = payload.error_message
    model_step = next((step for step in run.steps if step.step_type == "model"), None)
    if model_step:
        model_step.status = "completed" if payload.success else "failed"
        model_step.output_summary = "模型结果已生成" if payload.success else payload.error_message
        model_step.completed_at = now
    run.status = "awaiting_approval" if payload.success and run.approval else "completed" if payload.success else "failed"
    run.completed_at = None if run.status == "awaiting_approval" else now
    run.agent.run_count += 1
    if payload.success:
        run.agent.success_count += 1
    run.agent.last_run_at = now
    await session.commit()
    return _run_item(await _load_run(session, run.id))


@router.get("/agent-runs", response_model=AgentRunList)
async def list_agent_runs(session: Session, user: User, limit: int = Query(default=50, ge=1, le=200)) -> AgentRunList:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    query = select(AgentRun).options(*_run_options()).order_by(AgentRun.created_at.desc()).limit(limit)
    if not user.has_permission("accounts.manage_platform"):
        query = query.where(AgentRun.requested_by_employee_id == user.employeeId)
    runs = (await session.scalars(query)).unique().all()
    return AgentRunList(items=[_run_item(run) for run in runs], total=len(runs))


@router.get("/agent-runs/{run_id}", response_model=AgentRunItem)
async def get_agent_run(run_id: uuid.UUID, session: Session, user: User) -> AgentRunItem:
    _require_any(user, "accounts.use_ai_assistant", "accounts.manage_platform")
    run = await _load_run(session, run_id)
    if run.requested_by_employee_id != user.employeeId and not user.has_permission("accounts.manage_platform"):
        raise HTTPException(status_code=403, detail="不能查看其他用户的运行")
    return _run_item(run)


@router.post("/approvals/{approval_id}/decision", response_model=AgentRunItem)
async def decide_approval(approval_id: uuid.UUID, payload: ApprovalDecision, session: Session, user: User) -> AgentRunItem:
    _require_any(user, "accounts.create_content", "accounts.manage_platform")
    approval = await session.scalar(select(Approval).where(Approval.id == approval_id).options(selectinload(Approval.run).selectinload(AgentRun.steps)))
    if not approval:
        raise HTTPException(status_code=404, detail="审批不存在")
    if approval.status != "pending":
        return _run_item(await _load_run(session, approval.run_id))
    now = datetime.now(timezone.utc)
    approval.status = payload.decision
    approval.review_note = payload.note
    approval.reviewed_by_employee_id = user.employeeId
    approval.reviewed_by_name = user.displayName
    approval.reviewed_at = now
    approval.run.status = "ready_for_execution" if payload.decision == "approved" else "rejected"
    approval.run.completed_at = now if payload.decision == "rejected" else None
    for step in approval.run.steps:
        if step.step_type == "skill" and step.status == "blocked":
            step.status = "pending" if payload.decision == "approved" else "skipped"
            step.output_summary = "审批通过，等待受控 Worker 执行" if payload.decision == "approved" else "审批拒绝，未执行"
            step.completed_at = now if payload.decision == "rejected" else None
    await session.commit()
    return _run_item(await _load_run(session, approval.run_id))
