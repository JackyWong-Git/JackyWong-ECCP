from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .credential_crypto import CredentialDecryptionError, decrypt_credential
from .models import ModelProvider


@dataclass(frozen=True)
class ResolvedModelRuntime:
    configured: bool
    model: str
    provider_name: str
    base_url: str
    api_key: str
    source: str
    provider: ModelProvider | None = None
    error: str = ""


async def resolve_model_runtime(session: AsyncSession) -> ResolvedModelRuntime:
    provider = await session.scalar(
        select(ModelProvider)
        .where(
            ModelProvider.enabled.is_(True),
            ModelProvider.status == "connected",
        )
        .order_by(
            ModelProvider.is_default.desc(),
            ModelProvider.last_tested_at.desc(),
            ModelProvider.updated_at.desc(),
        )
        .limit(1)
    )
    if provider:
        try:
            api_key = decrypt_credential(provider.api_key_ciphertext)
        except CredentialDecryptionError as error:
            return ResolvedModelRuntime(
                configured=False,
                model=provider.default_model,
                provider_name=provider.name,
                base_url=provider.base_url,
                api_key="",
                source="saved_provider",
                provider=provider,
                error=str(error),
            )
        return ResolvedModelRuntime(
            configured=True,
            model=provider.default_model,
            provider_name=provider.name,
            base_url=provider.base_url,
            api_key=api_key,
            source="default_provider" if provider.is_default else "connected_provider",
            provider=provider,
        )

    settings = get_settings()
    return ResolvedModelRuntime(
        configured=bool(settings.llm_api_key),
        model=settings.llm_model,
        provider_name="环境变量配置",
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
        source="environment",
        error="" if settings.llm_api_key else "尚未配置并测试可用的模型供应商",
    )
