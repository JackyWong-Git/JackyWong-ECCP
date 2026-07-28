import ipaddress
import socket
import time
import uuid
from datetime import datetime, timezone
from typing import Annotated
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..credential_crypto import CredentialDecryptionError, decrypt_credential, encrypt_credential
from ..database import get_session
from ..model_provider_schemas import (
    ModelChatRequest,
    ModelChatResponse,
    ModelProviderActivate,
    ModelProviderCreate,
    ModelProviderItem,
    ModelProviderList,
    ModelProviderTestResult,
    ModelProviderUpdate,
    ModelRuntimeStatus,
)
from ..model_runtime import resolve_model_runtime
from ..models import Agent, ModelProvider
from ..security import InternalUser, get_internal_user


router = APIRouter(prefix="/v1", tags=["model-providers"])
Session = Annotated[AsyncSession, Depends(get_session)]
User = Annotated[InternalUser, Depends(get_internal_user)]


def _require_superuser(user: InternalUser) -> None:
    if not user.isSuperuser:
        raise HTTPException(status_code=403, detail="只有超级管理员可以管理模型凭据")


def _masked(provider: ModelProvider) -> str:
    return f"••••••••{provider.api_key_hint}" if provider.api_key_hint else "••••••••"


def _item(provider: ModelProvider) -> ModelProviderItem:
    return ModelProviderItem(
        id=provider.id,
        provider_key=provider.provider_key,
        name=provider.name,
        base_url=provider.base_url,
        default_model=provider.default_model,
        api_key_masked=_masked(provider),
        has_api_key=bool(provider.api_key_ciphertext),
        enabled=provider.enabled,
        is_default=provider.is_default,
        status=provider.status,
        last_error=provider.last_error,
        last_tested_at=provider.last_tested_at,
        updated_at=provider.updated_at,
    )


async def _provider(session: AsyncSession, provider_id: uuid.UUID) -> ModelProvider:
    provider = await session.get(ModelProvider, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="模型供应商不存在")
    return provider


async def _call_provider(
    *,
    base_url: str,
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
) -> tuple[dict, int]:
    settings = get_settings()
    parsed = urlparse(base_url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise HTTPException(status_code=400, detail="模型服务地址必须使用有效的 HTTPS URL")
    if not settings.allow_private_model_endpoints:
        try:
            addresses = {item[4][0] for item in socket.getaddrinfo(parsed.hostname, parsed.port or 443)}
        except socket.gaierror as error:
            raise HTTPException(status_code=502, detail="模型服务域名无法解析") from error
        for address in addresses:
            ip = ipaddress.ip_address(address)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                raise HTTPException(status_code=400, detail="模型服务地址不能指向本机或私有网络")
    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(
                base_url,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": False,
                },
            )
    except httpx.RequestError as error:
        raise HTTPException(status_code=502, detail=f"无法连接模型服务：{error.__class__.__name__}") from error
    latency_ms = round((time.perf_counter() - started) * 1000)
    try:
        data = response.json()
    except ValueError as error:
        raise HTTPException(status_code=502, detail="模型服务返回了非 JSON 响应") from error
    if not response.is_success:
        message = data.get("error", {}).get("message") if isinstance(data, dict) else ""
        raise HTTPException(status_code=502, detail=message or f"模型服务返回 HTTP {response.status_code}")
    return data, latency_ms


@router.get("/model-providers", response_model=ModelProviderList)
async def list_model_providers(session: Session, user: User) -> ModelProviderList:
    _require_superuser(user)
    settings = get_settings()
    providers = (await session.scalars(select(ModelProvider).order_by(ModelProvider.is_default.desc(), ModelProvider.created_at))).all()
    return ModelProviderList(
        items=[_item(provider) for provider in providers],
        environment_fallback_configured=bool(settings.llm_api_key),
        environment_fallback_model=settings.llm_model,
        environment_fallback_base_url=settings.llm_base_url,
    )


@router.post("/model-providers", response_model=ModelProviderItem, status_code=status.HTTP_201_CREATED)
async def create_model_provider(payload: ModelProviderCreate, session: Session, user: User) -> ModelProviderItem:
    _require_superuser(user)
    if await session.scalar(select(ModelProvider.id).where(ModelProvider.provider_key == payload.provider_key)):
        raise HTTPException(status_code=409, detail="供应商标识已存在")
    provider = ModelProvider(
        provider_key=payload.provider_key,
        name=payload.name.strip(),
        base_url=str(payload.base_url),
        default_model=payload.default_model.strip(),
        api_key_ciphertext=encrypt_credential(payload.api_key.strip()),
        api_key_hint=payload.api_key.strip()[-4:],
        created_by_employee_id=user.employeeId,
        created_by_name=user.displayName,
    )
    session.add(provider)
    await session.commit()
    await session.refresh(provider)
    return _item(provider)


@router.patch("/model-providers/{provider_id}", response_model=ModelProviderItem)
async def update_model_provider(provider_id: uuid.UUID, payload: ModelProviderUpdate, session: Session, user: User) -> ModelProviderItem:
    _require_superuser(user)
    provider = await _provider(session, provider_id)
    changes = payload.model_dump(exclude_unset=True)
    api_key = changes.pop("api_key", None)
    for key, value in changes.items():
        setattr(provider, key, str(value) if key == "base_url" else value)
    if api_key:
        provider.api_key_ciphertext = encrypt_credential(api_key.strip())
        provider.api_key_hint = api_key.strip()[-4:]
    provider.status = "untested"
    provider.last_error = ""
    await session.commit()
    await session.refresh(provider)
    return _item(provider)


@router.post("/model-providers/{provider_id}/test", response_model=ModelProviderTestResult)
async def test_model_provider(provider_id: uuid.UUID, session: Session, user: User) -> ModelProviderTestResult:
    _require_superuser(user)
    provider = await _provider(session, provider_id)
    try:
        api_key = decrypt_credential(provider.api_key_ciphertext)
        data, latency_ms = await _call_provider(
            base_url=provider.base_url,
            api_key=api_key,
            model=provider.default_model,
            messages=[{"role": "user", "content": "Reply with OK only."}],
            temperature=0,
            max_tokens=8,
        )
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        if not content:
            raise HTTPException(status_code=502, detail="模型服务未返回有效内容")
    except (CredentialDecryptionError, HTTPException) as error:
        provider.status = "error"
        provider.last_error = error.args[0] if isinstance(error, CredentialDecryptionError) else str(error.detail)
        provider.last_tested_at = datetime.now(timezone.utc)
        await session.commit()
        if isinstance(error, HTTPException):
            raise
        raise HTTPException(status_code=503, detail=str(error)) from error
    provider.status = "connected"
    provider.last_error = ""
    provider.last_tested_at = datetime.now(timezone.utc)
    await session.commit()
    return ModelProviderTestResult(
        ok=True,
        provider_id=provider.id,
        model=data.get("model") or provider.default_model,
        latency_ms=latency_ms,
        message="连接成功，模型已返回有效响应",
    )


@router.post("/model-providers/{provider_id}/activate", response_model=ModelProviderItem)
async def activate_model_provider(provider_id: uuid.UUID, payload: ModelProviderActivate, session: Session, user: User) -> ModelProviderItem:
    _require_superuser(user)
    provider = await _provider(session, provider_id)
    if provider.status != "connected":
        raise HTTPException(status_code=409, detail="请先完成连接测试，再设为平台默认")
    await session.execute(update(ModelProvider).values(is_default=False))
    provider.is_default = True
    provider.enabled = True
    if payload.apply_model_to_agents:
        await session.execute(update(Agent).values(model_id=provider.default_model))
    await session.commit()
    await session.refresh(provider)
    return _item(provider)


@router.delete("/model-providers/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model_provider(provider_id: uuid.UUID, session: Session, user: User) -> None:
    _require_superuser(user)
    provider = await _provider(session, provider_id)
    if provider.is_default:
        raise HTTPException(status_code=409, detail="默认模型供应商不能删除，请先切换到其他供应商")
    await session.delete(provider)
    await session.commit()


@router.get("/model-runtime/status", response_model=ModelRuntimeStatus)
async def model_runtime_status(session: Session, user: User) -> ModelRuntimeStatus:
    if not user.has_permission("accounts.use_ai_assistant"):
        raise HTTPException(status_code=403, detail="当前账号没有使用 AI 助手的权限")
    runtime = await resolve_model_runtime(session)
    is_default = bool(runtime.provider and runtime.provider.is_default)
    if runtime.configured:
        message = (
            "平台默认模型已就绪"
            if is_default or runtime.source == "environment"
            else "已自动使用最近测试通过的供应商，建议管理员将其设为平台默认"
        )
    else:
        message = runtime.error or "尚未配置可用模型"
    return ModelRuntimeStatus(
        configured=runtime.configured,
        model=runtime.model,
        provider=runtime.provider_name,
        source=runtime.source,
        is_default=is_default,
        message=message,
    )


@router.post("/model-runtime/chat", response_model=ModelChatResponse)
async def model_runtime_chat(payload: ModelChatRequest, session: Session, user: User) -> ModelChatResponse:
    if not user.has_permission("accounts.use_ai_assistant"):
        raise HTTPException(status_code=403, detail="当前账号没有使用 AI 助手的权限")
    runtime = await resolve_model_runtime(session)
    if not runtime.configured:
        raise HTTPException(status_code=503, detail=runtime.error or "尚未配置可用的模型供应商或 LLM API Key")
    data, _ = await _call_provider(
        base_url=runtime.base_url,
        api_key=runtime.api_key,
        model=runtime.model,
        messages=[message.model_dump() for message in payload.messages],
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
    )
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    if not content:
        raise HTTPException(status_code=502, detail="模型服务未返回有效内容")
    return ModelChatResponse(
        content=content,
        model=data.get("model") or runtime.model,
        provider=runtime.provider_name,
        usage=data.get("usage"),
    )
