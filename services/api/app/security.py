import base64
import hashlib
import hmac
import json
import time
from typing import Annotated

from fastapi import Header, HTTPException, status
from pydantic import BaseModel, Field, ValidationError

from .config import get_settings


class InternalUser(BaseModel):
    id: int
    username: str
    displayName: str
    employeeId: str
    department: str = ""
    accessScope: str = "self"
    isSuperuser: bool = False
    permissions: list[str] = Field(default_factory=list)

    def has_permission(self, permission: str) -> bool:
        return self.isSuperuser or "*" in self.permissions or permission in self.permissions


def _decode_base64url(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def sign_internal_user(encoded_user: str, timestamp: str, secret: str) -> str:
    message = f"{timestamp}.{encoded_user}".encode()
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


async def get_internal_user(
    x_eccp_user: Annotated[str | None, Header()] = None,
    x_eccp_timestamp: Annotated[str | None, Header()] = None,
    x_eccp_signature: Annotated[str | None, Header()] = None,
) -> InternalUser:
    settings = get_settings()
    if not x_eccp_user or not x_eccp_timestamp or not x_eccp_signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="缺少内部身份凭据")
    try:
        timestamp = int(x_eccp_timestamp)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="内部身份时间戳无效") from error
    if abs(int(time.time()) - timestamp) > settings.internal_auth_max_age_seconds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="内部身份凭据已过期")
    expected = sign_internal_user(x_eccp_user, x_eccp_timestamp, settings.internal_auth_secret)
    if not hmac.compare_digest(expected, x_eccp_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="内部身份签名无效")
    try:
        payload = json.loads(_decode_base64url(x_eccp_user))
        return InternalUser.model_validate(payload)
    except (ValueError, ValidationError) as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="内部身份内容无效") from error


def require_permission(user: InternalUser, permission: str) -> None:
    if not user.has_permission(permission):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="当前账号没有执行此操作的权限")
