import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from .config import get_settings


class CredentialDecryptionError(RuntimeError):
    pass


def _fernet() -> Fernet:
    settings = get_settings()
    source = settings.credential_encryption_key or settings.internal_auth_secret
    digest = hashlib.sha256(source.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_credential(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("ascii")


def decrypt_credential(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode("ascii")).decode("utf-8")
    except (InvalidToken, ValueError) as error:
        raise CredentialDecryptionError("模型凭据无法解密，请由管理员重新保存 API Key") from error
