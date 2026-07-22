import uuid
from datetime import date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


json_type = JSONB().with_variant(JSON(), "sqlite")
vector_type = Vector(1536).with_variant(JSON(), "sqlite")


class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    embedding_model: Mapped[str] = mapped_column(String(120), default="text-embedding-3-small")
    status: Mapped[str] = mapped_column(String(24), default="ready", index=True)
    created_by_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    documents: Mapped[list["Document"]] = relationship(back_populates="knowledge_base", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    knowledge_base_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("knowledge_bases.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(120), default="application/octet-stream")
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    object_key: Mapped[str] = mapped_column(String(600), unique=True)
    status: Mapped[str] = mapped_column(String(24), default="queued", index=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str] = mapped_column(Text, default="")
    created_by_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    knowledge_base: Mapped[KnowledgeBase] = relationship(back_populates="documents")
    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = (Index("ix_document_chunks_kb_document", "knowledge_base_id", "document_id"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    knowledge_base_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("knowledge_bases.id", ondelete="CASCADE"), index=True)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    ordinal: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    token_estimate: Mapped[int] = mapped_column(Integer, default=0)
    embedding: Mapped[list[float]] = mapped_column(vector_type)
    chunk_metadata: Mapped[dict] = mapped_column(json_type, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped[Document] = relationship(back_populates="chunks")


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(240), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    material_type: Mapped[str] = mapped_column(String(40), default="event")
    category: Mapped[str] = mapped_column(String(80), default="其他")
    source_department: Mapped[str] = mapped_column(String(160), index=True)
    source_contact: Mapped[str] = mapped_column(String(80), default="")
    happened_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str] = mapped_column(String(200), default="")
    vp_attend: Mapped[bool] = mapped_column(Boolean, default=False)
    urgency: Mapped[str] = mapped_column(String(24), default="normal")
    status: Mapped[str] = mapped_column(String(24), default="pending", index=True)
    tags: Mapped[list[str]] = mapped_column(json_type, default=list)
    expected_channels: Mapped[list[str]] = mapped_column(json_type, default=list)
    selected_channels: Mapped[list[str]] = mapped_column(json_type, default=list)
    assignee_name: Mapped[str] = mapped_column(String(80), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    object_key: Mapped[str | None] = mapped_column(String(600), nullable=True, unique=True)
    original_filename: Mapped[str] = mapped_column(String(255), default="")
    content_type: Mapped[str] = mapped_column(String(120), default="")
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    created_by_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    created_by_name: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    topics: Mapped[list["Topic"]] = relationship(back_populates="material")
    tasks: Mapped[list["ContentTask"]] = relationship(back_populates="material")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    material_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("materials.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(240), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(24), default="idea", index=True)
    priority: Mapped[str] = mapped_column(String(24), default="normal", index=True)
    assignee_employee_id: Mapped[str] = mapped_column(String(16), default="", index=True)
    assignee_name: Mapped[str] = mapped_column(String(80), default="")
    tags: Mapped[list[str]] = mapped_column(json_type, default=list)
    source: Mapped[str] = mapped_column(String(160), default="团队创建")
    source_url: Mapped[str] = mapped_column(String(1000), default="")
    channel: Mapped[str] = mapped_column(String(80), default="全渠道")
    estimated_words: Mapped[int] = mapped_column(Integer, default=0)
    created_by_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    created_by_name: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    material: Mapped[Material | None] = relationship(back_populates="topics")
    tasks: Mapped[list["ContentTask"]] = relationship(back_populates="topic")


class ContentTask(Base):
    __tablename__ = "content_tasks"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True
    )
    material_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("materials.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(240), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    project_name: Mapped[str] = mapped_column(String(160), default="内容协同")
    status: Mapped[str] = mapped_column(String(24), default="todo", index=True)
    priority: Mapped[str] = mapped_column(String(24), default="normal", index=True)
    owner_employee_id: Mapped[str] = mapped_column(String(16), default="", index=True)
    owner_name: Mapped[str] = mapped_column(String(80), default="")
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    ai_created: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_by_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    created_by_name: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    topic: Mapped[Topic | None] = relationship(back_populates="tasks")
    material: Mapped[Material | None] = relationship(back_populates="tasks")
    publications: Mapped[list["Publication"]] = relationship(back_populates="task", cascade="all, delete-orphan")


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("content_tasks.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(240), index=True)
    channel: Mapped[str] = mapped_column(String(80), index=True)
    status: Mapped[str] = mapped_column(String(24), default="draft", index=True)
    external_url: Mapped[str] = mapped_column(String(1000), default="")
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    reviewer_employee_id: Mapped[str] = mapped_column(String(16), default="")
    reviewer_name: Mapped[str] = mapped_column(String(80), default="")
    publisher_employee_id: Mapped[str] = mapped_column(String(16), default="")
    publisher_name: Mapped[str] = mapped_column(String(80), default="")
    created_by_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    task: Mapped[ContentTask] = relationship(back_populates="publications")
    metric: Mapped["PublicationMetric | None"] = relationship(
        back_populates="publication", cascade="all, delete-orphan", uselist=False
    )


class PublicationMetric(Base):
    __tablename__ = "publication_metrics"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publication_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("publications.id", ondelete="CASCADE"), unique=True, index=True
    )
    views: Mapped[int] = mapped_column(BigInteger, default=0)
    likes: Mapped[int] = mapped_column(BigInteger, default=0)
    comments: Mapped[int] = mapped_column(BigInteger, default=0)
    shares: Mapped[int] = mapped_column(BigInteger, default=0)
    favorites: Mapped[int] = mapped_column(BigInteger, default=0)
    conversions: Mapped[int] = mapped_column(BigInteger, default=0)
    completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)
    raw_metrics: Mapped[dict] = mapped_column(json_type, default=dict)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    publication: Mapped[Publication] = relationship(back_populates="metric")


class WorkflowEvent(Base):
    __tablename__ = "workflow_events"
    __table_args__ = (Index("ix_workflow_events_entity", "entity_type", "entity_id"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(40), index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    from_status: Mapped[str] = mapped_column(String(24), default="")
    to_status: Mapped[str] = mapped_column(String(24), default="")
    actor_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    actor_name: Mapped[str] = mapped_column(String(80), default="")
    event_metadata: Mapped[dict] = mapped_column(json_type, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)


class SkillSource(Base):
    __tablename__ = "skill_sources"
    __table_args__ = (UniqueConstraint("repository_url", "git_ref", name="uq_skill_sources_repo_ref"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), index=True)
    source_type: Mapped[str] = mapped_column(String(24), default="github", index=True)
    repository_url: Mapped[str] = mapped_column(String(1000))
    owner: Mapped[str] = mapped_column(String(120), default="")
    repository: Mapped[str] = mapped_column(String(160), default="")
    git_ref: Mapped[str] = mapped_column(String(240), default="main")
    status: Mapped[str] = mapped_column(String(24), default="active", index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_scanned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    created_by_name: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    skills: Mapped[list["SkillPackage"]] = relationship(back_populates="source", cascade="all, delete-orphan")
    audit_logs: Mapped[list["SkillAuditLog"]] = relationship(back_populates="source")


class SkillPackage(Base):
    __tablename__ = "skill_packages"
    __table_args__ = (UniqueConstraint("source_id", "skill_path", name="uq_skill_packages_source_path"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skill_sources.id", ondelete="CASCADE"), index=True)
    slug: Mapped[str] = mapped_column(String(180), index=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(80), default="通用能力", index=True)
    author: Mapped[str] = mapped_column(String(160), default="")
    skill_path: Mapped[str] = mapped_column(String(600))
    homepage: Mapped[str] = mapped_column(String(1000), default="")
    license: Mapped[str] = mapped_column(String(80), default="")
    risk_level: Mapped[str] = mapped_column(String(16), default="low", index=True)
    risk_findings: Mapped[list[dict]] = mapped_column(json_type, default=list)
    capabilities: Mapped[list[str]] = mapped_column(json_type, default=list)
    required_env: Mapped[list[str]] = mapped_column(json_type, default=list)
    required_bins: Mapped[list[str]] = mapped_column(json_type, default=list)
    suggested_businesses: Mapped[list[str]] = mapped_column(json_type, default=list)
    deprecated_by: Mapped[str] = mapped_column(String(180), default="")
    latest_version: Mapped[str] = mapped_column(String(80), default="0.0.0")
    latest_commit_sha: Mapped[str] = mapped_column(String(64), default="")
    manifest: Mapped[dict] = mapped_column(json_type, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    source: Mapped[SkillSource] = relationship(back_populates="skills")
    releases: Mapped[list["SkillRelease"]] = relationship(back_populates="skill", cascade="all, delete-orphan")
    installation: Mapped["SkillInstallation | None"] = relationship(back_populates="skill", cascade="all, delete-orphan", uselist=False)
    bindings: Mapped[list["SkillBinding"]] = relationship(back_populates="skill", cascade="all, delete-orphan")
    audit_logs: Mapped[list["SkillAuditLog"]] = relationship(back_populates="skill")


class SkillRelease(Base):
    __tablename__ = "skill_releases"
    __table_args__ = (UniqueConstraint("skill_id", "checksum", name="uq_skill_releases_skill_checksum"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skill_packages.id", ondelete="CASCADE"), index=True)
    version: Mapped[str] = mapped_column(String(80), default="0.0.0")
    commit_sha: Mapped[str] = mapped_column(String(64), default="")
    checksum: Mapped[str] = mapped_column(String(64))
    manifest: Mapped[dict] = mapped_column(json_type, default=dict)
    discovered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    skill: Mapped[SkillPackage] = relationship(back_populates="releases")
    installations: Mapped[list["SkillInstallation"]] = relationship(back_populates="release")


class SkillInstallation(Base):
    __tablename__ = "skill_installations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skill_packages.id", ondelete="CASCADE"), unique=True, index=True)
    release_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skill_releases.id", ondelete="RESTRICT"), index=True)
    status: Mapped[str] = mapped_column(String(24), default="active", index=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    preflight_status: Mapped[str] = mapped_column(String(24), default="not_run")
    preflight_result: Mapped[dict] = mapped_column(json_type, default=dict)
    config: Mapped[dict] = mapped_column(json_type, default=dict)
    installed_by_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    installed_by_name: Mapped[str] = mapped_column(String(80), default="")
    installed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    skill: Mapped[SkillPackage] = relationship(back_populates="installation")
    release: Mapped[SkillRelease] = relationship(back_populates="installations")


class SkillBinding(Base):
    __tablename__ = "skill_bindings"
    __table_args__ = (UniqueConstraint("skill_id", "business_key", name="uq_skill_bindings_skill_business"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("skill_packages.id", ondelete="CASCADE"), index=True)
    business_key: Mapped[str] = mapped_column(String(80), index=True)
    business_name: Mapped[str] = mapped_column(String(120))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    config: Mapped[dict] = mapped_column(json_type, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    skill: Mapped[SkillPackage] = relationship(back_populates="bindings")


class SkillAuditLog(Base):
    __tablename__ = "skill_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("skill_packages.id", ondelete="SET NULL"), nullable=True, index=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("skill_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    status: Mapped[str] = mapped_column(String(24), default="success", index=True)
    detail: Mapped[str] = mapped_column(Text, default="")
    event_metadata: Mapped[dict] = mapped_column(json_type, default=dict)
    actor_employee_id: Mapped[str] = mapped_column(String(16), index=True)
    actor_name: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    skill: Mapped[SkillPackage | None] = relationship(back_populates="audit_logs")
    source: Mapped[SkillSource | None] = relationship(back_populates="audit_logs")
