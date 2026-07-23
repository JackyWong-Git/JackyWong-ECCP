from functools import lru_cache
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env.local", PROJECT_ROOT / ".env"),
        env_prefix="ECCP_API_",
        extra="ignore",
    )

    environment: str = "development"
    database_url: str = f"sqlite+aiosqlite:///{PROJECT_ROOT / 'backend/eccp_api.db'}"
    auto_create_schema: bool = True
    redis_url: str = ""
    redis_queue_name: str = "eccp:rag:index-jobs"
    internal_auth_secret: str = "eccp-local-internal-auth-only"
    internal_auth_max_age_seconds: int = 300
    storage_backend: str = "local"
    storage_dir: Path = PROJECT_ROOT / ".eccp-data/objects"
    s3_endpoint_url: str = ""
    s3_region: str = "us-east-1"
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket: str = "eccp-documents"
    max_upload_bytes: int = 50 * 1024 * 1024
    embedding_provider: str = "local_hash"
    embedding_api_url: str = ""
    embedding_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    chunk_size: int = 1000
    chunk_overlap: int = 120

    @model_validator(mode="after")
    def resolve_project_paths(self):
        sqlite_prefix = "sqlite+aiosqlite:///./"
        if self.database_url.startswith(sqlite_prefix):
            relative_database = self.database_url.removeprefix(sqlite_prefix)
            self.database_url = f"sqlite+aiosqlite:///{PROJECT_ROOT / relative_database}"
        if not self.storage_dir.is_absolute():
            self.storage_dir = PROJECT_ROOT / self.storage_dir
        return self

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()
