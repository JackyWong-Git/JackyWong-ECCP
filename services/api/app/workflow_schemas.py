import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MaterialCreate(BaseModel):
    title: str = Field(min_length=2, max_length=240)
    description: str = Field(default="", max_length=20_000)
    material_type: str = Field(default="event", max_length=40)
    category: str = Field(default="其他", max_length=80)
    source_department: str = Field(min_length=2, max_length=160)
    source_contact: str = Field(default="", max_length=80)
    happened_at: date | None = None
    location: str = Field(default="", max_length=200)
    vp_attend: bool = False
    urgency: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    tags: list[str] = Field(default_factory=list, max_length=30)
    expected_channels: list[str] = Field(default_factory=list, max_length=20)
    notes: str = Field(default="", max_length=5000)


class MaterialUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=240)
    description: str | None = Field(default=None, max_length=20_000)
    material_type: str | None = Field(default=None, max_length=40)
    category: str | None = Field(default=None, max_length=80)
    source_department: str | None = Field(default=None, min_length=2, max_length=160)
    source_contact: str | None = Field(default=None, max_length=80)
    happened_at: date | None = None
    location: str | None = Field(default=None, max_length=200)
    vp_attend: bool | None = None
    urgency: str | None = Field(default=None, pattern="^(low|normal|high|urgent)$")
    status: str | None = Field(default=None, pattern="^(pending|selected|in_progress|published|rejected)$")
    tags: list[str] | None = Field(default=None, max_length=30)
    expected_channels: list[str] | None = Field(default=None, max_length=20)
    selected_channels: list[str] | None = Field(default=None, max_length=20)
    assignee_name: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=5000)


class MaterialItem(OrmModel):
    id: uuid.UUID
    title: str
    description: str
    material_type: str
    category: str
    source_department: str
    source_contact: str
    happened_at: date | None
    location: str
    vp_attend: bool
    urgency: str
    status: str
    tags: list[str]
    expected_channels: list[str]
    selected_channels: list[str]
    assignee_name: str
    notes: str
    original_filename: str
    content_type: str
    size_bytes: int
    created_by_employee_id: str
    created_by_name: str
    created_at: datetime
    updated_at: datetime


class MaterialList(BaseModel):
    items: list[MaterialItem]
    total: int


class TopicCreate(BaseModel):
    material_id: uuid.UUID | None = None
    title: str = Field(min_length=2, max_length=240)
    description: str = Field(default="", max_length=20_000)
    status: str = Field(default="idea", pattern="^(idea|research|approved|in_progress|done|archived)$")
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    assignee_employee_id: str = Field(default="", max_length=16)
    assignee_name: str = Field(default="", max_length=80)
    tags: list[str] = Field(default_factory=list, max_length=30)
    source: str = Field(default="团队创建", max_length=160)
    source_url: str = Field(default="", max_length=1000)
    channel: str = Field(default="全渠道", max_length=80)
    estimated_words: int = Field(default=0, ge=0, le=100_000)


class TopicUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=240)
    description: str | None = Field(default=None, max_length=20_000)
    status: str | None = Field(default=None, pattern="^(idea|research|approved|in_progress|done|archived)$")
    priority: str | None = Field(default=None, pattern="^(low|normal|high|urgent)$")
    assignee_employee_id: str | None = Field(default=None, max_length=16)
    assignee_name: str | None = Field(default=None, max_length=80)
    tags: list[str] | None = Field(default=None, max_length=30)
    source: str | None = Field(default=None, max_length=160)
    source_url: str | None = Field(default=None, max_length=1000)
    channel: str | None = Field(default=None, max_length=80)
    estimated_words: int | None = Field(default=None, ge=0, le=100_000)


class TopicItem(OrmModel):
    id: uuid.UUID
    material_id: uuid.UUID | None
    title: str
    description: str
    status: str
    priority: str
    assignee_employee_id: str
    assignee_name: str
    tags: list[str]
    source: str
    source_url: str
    channel: str
    estimated_words: int
    created_by_employee_id: str
    created_by_name: str
    created_at: datetime
    updated_at: datetime


class TopicList(BaseModel):
    items: list[TopicItem]
    total: int


class ContentTaskCreate(BaseModel):
    topic_id: uuid.UUID | None = None
    material_id: uuid.UUID | None = None
    title: str = Field(min_length=2, max_length=240)
    description: str = Field(default="", max_length=20_000)
    project_name: str = Field(default="内容协同", max_length=160)
    status: str = Field(default="todo", pattern="^(todo|doing|review|approved|published|cancelled)$")
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    owner_employee_id: str = Field(default="", max_length=16)
    owner_name: str = Field(default="", max_length=80)
    due_at: datetime | None = None
    ai_created: bool = False


class ContentTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=240)
    description: str | None = Field(default=None, max_length=20_000)
    project_name: str | None = Field(default=None, max_length=160)
    priority: str | None = Field(default=None, pattern="^(low|normal|high|urgent)$")
    owner_employee_id: str | None = Field(default=None, max_length=16)
    owner_name: str | None = Field(default=None, max_length=80)
    due_at: datetime | None = None
    ai_created: bool | None = None


class ContentTaskItem(OrmModel):
    id: uuid.UUID
    topic_id: uuid.UUID | None
    material_id: uuid.UUID | None
    title: str
    description: str
    project_name: str
    status: str
    priority: str
    owner_employee_id: str
    owner_name: str
    due_at: datetime | None
    ai_created: bool
    version: int
    created_by_employee_id: str
    created_by_name: str
    created_at: datetime
    updated_at: datetime


class ContentTaskList(BaseModel):
    items: list[ContentTaskItem]
    total: int


class TaskTransition(BaseModel):
    status: str = Field(pattern="^(todo|doing|review|approved|published|cancelled)$")
    note: str = Field(default="", max_length=1000)


class PublicationCreate(BaseModel):
    task_id: uuid.UUID
    title: str = Field(min_length=2, max_length=240)
    channel: str = Field(min_length=1, max_length=80)
    status: str = Field(default="draft", pattern="^(draft|review|approved|published|failed)$")
    external_url: str = Field(default="", max_length=1000)
    scheduled_at: datetime | None = None
    published_at: datetime | None = None


class PublicationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=240)
    channel: str | None = Field(default=None, min_length=1, max_length=80)
    status: str | None = Field(default=None, pattern="^(draft|review|approved|published|failed)$")
    external_url: str | None = Field(default=None, max_length=1000)
    scheduled_at: datetime | None = None
    published_at: datetime | None = None


class PublicationItem(OrmModel):
    id: uuid.UUID
    task_id: uuid.UUID
    title: str
    channel: str
    status: str
    external_url: str
    scheduled_at: datetime | None
    published_at: datetime | None
    reviewer_employee_id: str
    reviewer_name: str
    publisher_employee_id: str
    publisher_name: str
    created_by_employee_id: str
    created_at: datetime
    updated_at: datetime


class PublicationList(BaseModel):
    items: list[PublicationItem]
    total: int


class PublishTaskRequest(BaseModel):
    channel: str = Field(min_length=1, max_length=80)
    external_url: str = Field(default="", max_length=1000)
    title: str = Field(default="", max_length=240)


class MetricCreate(BaseModel):
    views: int = Field(default=0, ge=0)
    likes: int = Field(default=0, ge=0)
    comments: int = Field(default=0, ge=0)
    shares: int = Field(default=0, ge=0)
    favorites: int = Field(default=0, ge=0)
    conversions: int = Field(default=0, ge=0)
    completion_rate: float = Field(default=0, ge=0, le=100)
    sentiment_score: float = Field(default=0, ge=-1, le=1)
    raw_metrics: dict = Field(default_factory=dict)


class MetricUpdate(MetricCreate):
    pass


class MetricItem(OrmModel):
    id: uuid.UUID
    publication_id: uuid.UUID
    views: int
    likes: int
    comments: int
    shares: int
    favorites: int
    conversions: int
    completion_rate: float
    sentiment_score: float
    raw_metrics: dict
    captured_at: datetime
    updated_at: datetime


class WorkflowScheduleRequest(BaseModel):
    create_topic: bool = True
    topic_title: str = Field(default="", max_length=240)
    project_name: str = Field(default="内容协同", max_length=160)
    owner_employee_id: str = Field(default="", max_length=16)
    owner_name: str = Field(default="", max_length=80)
    due_at: datetime | None = None
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")


class WorkflowScheduleResponse(BaseModel):
    material: MaterialItem
    topic: TopicItem | None
    task: ContentTaskItem


class DashboardMetric(BaseModel):
    publication_id: uuid.UUID
    title: str
    channel: str
    published_at: datetime | None
    views: int
    likes: int
    comments: int
    shares: int
    favorites: int
    conversions: int
    completion_rate: float


class DashboardSummary(BaseModel):
    total_views: int
    total_publications: int
    total_engagements: int
    total_conversions: int
    channel_totals: dict[str, int]
    items: list[DashboardMetric]
