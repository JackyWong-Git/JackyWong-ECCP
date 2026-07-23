"""Create content workflow tables.

Revision ID: 0002_content_workflow
Revises: 0001_rag_foundation
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = "0002_content_workflow"
down_revision = "0001_rag_foundation"
branch_labels = None
depends_on = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "materials",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("title", sa.String(240), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("material_type", sa.String(40), nullable=False, server_default="event"),
        sa.Column("category", sa.String(80), nullable=False, server_default="其他"),
        sa.Column("source_department", sa.String(160), nullable=False),
        sa.Column("source_contact", sa.String(80), nullable=False, server_default=""),
        sa.Column("happened_at", sa.Date(), nullable=True),
        sa.Column("location", sa.String(200), nullable=False, server_default=""),
        sa.Column("vp_attend", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("urgency", sa.String(24), nullable=False, server_default="normal"),
        sa.Column("status", sa.String(24), nullable=False, server_default="pending"),
        sa.Column("tags", JSONB(), nullable=False, server_default="[]"),
        sa.Column("expected_channels", JSONB(), nullable=False, server_default="[]"),
        sa.Column("selected_channels", JSONB(), nullable=False, server_default="[]"),
        sa.Column("assignee_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column("object_key", sa.String(600), nullable=True, unique=True),
        sa.Column("original_filename", sa.String(255), nullable=False, server_default=""),
        sa.Column("content_type", sa.String(120), nullable=False, server_default=""),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("created_by_employee_id", sa.String(16), nullable=False),
        sa.Column("created_by_name", sa.String(80), nullable=False, server_default=""),
        *timestamps(),
    )
    op.create_index("ix_materials_title", "materials", ["title"])
    op.create_index("ix_materials_status", "materials", ["status"])
    op.create_index("ix_materials_department", "materials", ["source_department"])

    op.create_table(
        "topics",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("material_id", sa.Uuid(), sa.ForeignKey("materials.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(240), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(24), nullable=False, server_default="idea"),
        sa.Column("priority", sa.String(24), nullable=False, server_default="normal"),
        sa.Column("assignee_employee_id", sa.String(16), nullable=False, server_default=""),
        sa.Column("assignee_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("tags", JSONB(), nullable=False, server_default="[]"),
        sa.Column("source", sa.String(160), nullable=False, server_default="团队创建"),
        sa.Column("source_url", sa.String(1000), nullable=False, server_default=""),
        sa.Column("channel", sa.String(80), nullable=False, server_default="全渠道"),
        sa.Column("estimated_words", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_by_employee_id", sa.String(16), nullable=False),
        sa.Column("created_by_name", sa.String(80), nullable=False, server_default=""),
        *timestamps(),
    )
    op.create_index("ix_topics_material_id", "topics", ["material_id"])
    op.create_index("ix_topics_title", "topics", ["title"])
    op.create_index("ix_topics_status", "topics", ["status"])
    op.create_index("ix_topics_priority", "topics", ["priority"])

    op.create_table(
        "content_tasks",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("topic_id", sa.Uuid(), sa.ForeignKey("topics.id", ondelete="SET NULL"), nullable=True),
        sa.Column("material_id", sa.Uuid(), sa.ForeignKey("materials.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(240), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("project_name", sa.String(160), nullable=False, server_default="内容协同"),
        sa.Column("status", sa.String(24), nullable=False, server_default="todo"),
        sa.Column("priority", sa.String(24), nullable=False, server_default="normal"),
        sa.Column("owner_employee_id", sa.String(16), nullable=False, server_default=""),
        sa.Column("owner_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ai_created", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by_employee_id", sa.String(16), nullable=False),
        sa.Column("created_by_name", sa.String(80), nullable=False, server_default=""),
        *timestamps(),
    )
    op.create_index("ix_content_tasks_topic_id", "content_tasks", ["topic_id"])
    op.create_index("ix_content_tasks_material_id", "content_tasks", ["material_id"])
    op.create_index("ix_content_tasks_title", "content_tasks", ["title"])
    op.create_index("ix_content_tasks_status", "content_tasks", ["status"])
    op.create_index("ix_content_tasks_due_at", "content_tasks", ["due_at"])

    op.create_table(
        "publications",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("task_id", sa.Uuid(), sa.ForeignKey("content_tasks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(240), nullable=False),
        sa.Column("channel", sa.String(80), nullable=False),
        sa.Column("status", sa.String(24), nullable=False, server_default="draft"),
        sa.Column("external_url", sa.String(1000), nullable=False, server_default=""),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewer_employee_id", sa.String(16), nullable=False, server_default=""),
        sa.Column("reviewer_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("publisher_employee_id", sa.String(16), nullable=False, server_default=""),
        sa.Column("publisher_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("created_by_employee_id", sa.String(16), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_publications_task_id", "publications", ["task_id"])
    op.create_index("ix_publications_channel", "publications", ["channel"])
    op.create_index("ix_publications_status", "publications", ["status"])
    op.create_index("ix_publications_published_at", "publications", ["published_at"])

    op.create_table(
        "publication_metrics",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("publication_id", sa.Uuid(), sa.ForeignKey("publications.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("views", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("likes", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("comments", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("shares", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("favorites", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("conversions", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("completion_rate", sa.Float(), nullable=False, server_default="0"),
        sa.Column("sentiment_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("raw_metrics", JSONB(), nullable=False, server_default="{}"),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_publication_metrics_publication_id", "publication_metrics", ["publication_id"])

    op.create_table(
        "workflow_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("entity_type", sa.String(40), nullable=False),
        sa.Column("entity_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("from_status", sa.String(24), nullable=False, server_default=""),
        sa.Column("to_status", sa.String(24), nullable=False, server_default=""),
        sa.Column("actor_employee_id", sa.String(16), nullable=False),
        sa.Column("actor_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("event_metadata", JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_workflow_events_entity", "workflow_events", ["entity_type", "entity_id"])
    op.create_index("ix_workflow_events_action", "workflow_events", ["action"])
    op.create_index("ix_workflow_events_created_at", "workflow_events", ["created_at"])


def downgrade() -> None:
    op.drop_table("workflow_events")
    op.drop_table("publication_metrics")
    op.drop_table("publications")
    op.drop_table("content_tasks")
    op.drop_table("topics")
    op.drop_table("materials")
