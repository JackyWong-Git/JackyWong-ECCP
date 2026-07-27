import uuid
from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, field_validator


class ModelProviderCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    provider_key: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9][a-z0-9_-]+$")
    base_url: HttpUrl
    default_model: str = Field(min_length=1, max_length=120)
    api_key: str = Field(min_length=8, max_length=2000)

    @field_validator("base_url")
    @classmethod
    def require_https(cls, value: HttpUrl) -> HttpUrl:
        if value.scheme != "https":
            raise ValueError("模型服务地址必须使用 HTTPS")
        return value


class ModelProviderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    base_url: HttpUrl | None = None
    default_model: str | None = Field(default=None, min_length=1, max_length=120)
    api_key: str | None = Field(default=None, min_length=8, max_length=2000)
    enabled: bool | None = None

    @field_validator("base_url")
    @classmethod
    def require_https(cls, value: HttpUrl | None) -> HttpUrl | None:
        if value is not None and value.scheme != "https":
            raise ValueError("模型服务地址必须使用 HTTPS")
        return value


class ModelProviderItem(BaseModel):
    id: uuid.UUID
    provider_key: str
    name: str
    base_url: str
    default_model: str
    api_key_masked: str
    has_api_key: bool
    enabled: bool
    is_default: bool
    status: str
    last_error: str
    last_tested_at: datetime | None
    updated_at: datetime


class ModelProviderList(BaseModel):
    items: list[ModelProviderItem]
    environment_fallback_configured: bool
    environment_fallback_model: str
    environment_fallback_base_url: str


class ModelProviderTestResult(BaseModel):
    ok: bool
    provider_id: uuid.UUID
    model: str
    latency_ms: int
    message: str


class ModelProviderActivate(BaseModel):
    apply_model_to_agents: bool = True


class ModelChatMessage(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=30_000)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in {"system", "user", "assistant"}:
            raise ValueError("消息角色无效")
        return value


class ModelChatRequest(BaseModel):
    messages: list[ModelChatMessage] = Field(min_length=1, max_length=40)
    model: str | None = Field(default=None, max_length=120)
    temperature: float = Field(default=0.65, ge=0, le=2)
    max_tokens: int = Field(default=2400, ge=1, le=16_000)


class ModelChatResponse(BaseModel):
    content: str
    model: str
    provider: str
    usage: dict | None = None
