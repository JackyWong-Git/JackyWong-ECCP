import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SkillDiscoverRequest(BaseModel):
    url: str = Field(min_length=20, max_length=1200)


class BusinessBindingInput(BaseModel):
    business_key: str = Field(min_length=2, max_length=80)
    business_name: str = Field(min_length=2, max_length=120)
    enabled: bool = True
    config: dict = Field(default_factory=dict)


class SkillInstallRequest(BaseModel):
    release_id: uuid.UUID | None = None
    accept_risk: bool = False
    bindings: list[BusinessBindingInput] = Field(default_factory=list, max_length=20)
    config: dict = Field(default_factory=dict)


class SkillInstallationUpdate(BaseModel):
    enabled: bool | None = None
    config: dict | None = None


class SkillBindingsUpdate(BaseModel):
    bindings: list[BusinessBindingInput] = Field(default_factory=list, max_length=20)


class SkillUpdateRequest(BaseModel):
    accept_risk: bool = False


class SkillRollbackRequest(BaseModel):
    release_id: uuid.UUID
    accept_risk: bool = False


class SkillReleaseItem(BaseModel):
    id: uuid.UUID
    version: str
    commit_sha: str
    checksum: str
    discovered_at: datetime


class SkillBindingItem(BaseModel):
    id: uuid.UUID
    business_key: str
    business_name: str
    enabled: bool
    config: dict


class SkillInstallationItem(BaseModel):
    id: uuid.UUID
    release_id: uuid.UUID
    version: str
    status: str
    enabled: bool
    preflight_status: str
    preflight_result: dict
    config: dict
    installed_by_name: str
    installed_at: datetime
    updated_at: datetime


class SkillItem(BaseModel):
    id: uuid.UUID
    source_id: uuid.UUID
    source_name: str
    repository_url: str
    git_ref: str
    slug: str
    name: str
    description: str
    category: str
    author: str
    skill_path: str
    homepage: str
    risk_level: str
    risk_findings: list[dict]
    capabilities: list[str]
    required_env: list[str]
    required_bins: list[str]
    suggested_businesses: list[str]
    deprecated_by: str
    latest_version: str
    latest_commit_sha: str
    status: str
    update_available: bool
    installation: SkillInstallationItem | None
    bindings: list[SkillBindingItem]
    releases: list[SkillReleaseItem]
    created_at: datetime
    updated_at: datetime


class SkillList(BaseModel):
    items: list[SkillItem]
    total: int


class SkillDiscoverResponse(BaseModel):
    items: list[SkillItem]
    discovered: int
    new_releases: int


class PreflightCheck(BaseModel):
    key: str
    label: str
    status: str
    detail: str


class PreflightResponse(BaseModel):
    status: str
    checks: list[PreflightCheck]
    risk_level: str
    ready_for_install: bool


class SkillSourceItem(BaseModel):
    id: uuid.UUID
    name: str
    source_type: str
    repository_url: str
    owner: str
    repository: str
    git_ref: str
    status: str
    enabled: bool
    last_scanned_at: datetime | None


class SkillAuditItem(BaseModel):
    id: uuid.UUID
    skill_id: uuid.UUID | None
    source_id: uuid.UUID | None
    skill_name: str
    action: str
    status: str
    detail: str
    event_metadata: dict
    actor_name: str
    created_at: datetime
