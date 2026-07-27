import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=2000)
    category: str = Field(default="content", max_length=40)
    model_id: str = Field(default="deepseek-v4-pro", max_length=80)
    system_prompt: str = Field(min_length=10, max_length=30000)
    routing_keywords: list[str] = Field(default_factory=list, max_length=40)
    business_keys: list[str] = Field(default_factory=list, max_length=20)


class AgentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, max_length=40)
    status: str | None = Field(default=None, max_length=24)
    model_id: str | None = Field(default=None, max_length=80)
    routing_keywords: list[str] | None = Field(default=None, max_length=40)
    business_keys: list[str] | None = Field(default=None, max_length=20)


class AgentVersionCreate(BaseModel):
    system_prompt: str = Field(min_length=10, max_length=30000)
    change_note: str = Field(default="", max_length=300)
    config: dict = Field(default_factory=dict)


class AgentSkillBindingInput(BaseModel):
    skill_id: uuid.UUID
    enabled: bool = True
    required: bool = False


class AgentSkillBindingsUpdate(BaseModel):
    bindings: list[AgentSkillBindingInput] = Field(default_factory=list, max_length=100)


class AgentKnowledgeBindingInput(BaseModel):
    knowledge_base_id: uuid.UUID
    enabled: bool = True
    top_k: int = Field(default=4, ge=1, le=20)


class AgentKnowledgeBindingsUpdate(BaseModel):
    bindings: list[AgentKnowledgeBindingInput] = Field(default_factory=list, max_length=100)


class AgentSkillItem(BaseModel):
    id: uuid.UUID
    skill_id: uuid.UUID
    name: str
    slug: str
    version: str
    risk_level: str
    enabled: bool
    required: bool
    regression_status: str
    suggested_businesses: list[str]


class AgentKnowledgeItem(BaseModel):
    id: uuid.UUID
    knowledge_base_id: uuid.UUID
    name: str
    enabled: bool
    top_k: int


class AgentVersionItem(BaseModel):
    id: uuid.UUID
    version: int
    system_prompt: str
    config: dict
    change_note: str
    created_by_name: str
    created_at: datetime


class AgentItem(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str
    category: str
    status: str
    model_id: str
    routing_keywords: list[str]
    business_keys: list[str]
    current_version: int
    current_prompt: str
    run_count: int
    success_count: int
    success_rate: float
    last_run_at: datetime | None
    skill_bindings: list[AgentSkillItem]
    knowledge_bindings: list[AgentKnowledgeItem]
    created_at: datetime
    updated_at: datetime


class AgentList(BaseModel):
    items: list[AgentItem]
    total: int


class AgentRunCreate(BaseModel):
    input_text: str = Field(min_length=1, max_length=50000)
    source: str = Field(default="assistant", max_length=24)
    agent_id: uuid.UUID | None = None
    business_key: str | None = Field(default=None, max_length=80)
    conversation_id: str = Field(default="", max_length=120)
    knowledge_enabled: bool = True
    web_enabled: bool = False


class AgentRunComplete(BaseModel):
    output_text: str = Field(default="", max_length=100000)
    success: bool = True
    error_message: str = Field(default="", max_length=10000)


class RunStepItem(BaseModel):
    id: uuid.UUID
    ordinal: int
    step_type: str
    name: str
    status: str
    skill_id: uuid.UUID | None
    knowledge_base_id: uuid.UUID | None
    input_summary: str
    output_summary: str
    metadata: dict
    started_at: datetime | None
    completed_at: datetime | None


class ApprovalItem(BaseModel):
    id: uuid.UUID
    approval_type: str
    status: str
    reason: str
    requested_by_name: str
    reviewed_by_name: str
    review_note: str
    reviewed_at: datetime | None
    created_at: datetime


class AgentRunItem(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    agent_name: str
    agent_status: str
    agent_version: int
    system_prompt: str
    source: str
    input_text: str
    output_text: str
    business_key: str
    status: str
    route_reason: str
    model_id: str
    conversation_id: str
    error_message: str
    requested_by_name: str
    started_at: datetime
    completed_at: datetime | None
    created_at: datetime
    steps: list[RunStepItem]
    approval: ApprovalItem | None


class AgentRunList(BaseModel):
    items: list[AgentRunItem]
    total: int


class ApprovalDecision(BaseModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    note: str = Field(default="", max_length=2000)
