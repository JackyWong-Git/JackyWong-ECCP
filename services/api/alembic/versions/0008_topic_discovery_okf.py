"""add topic discovery automation and OKF document metadata

Revision ID: 0008_topic_discovery_okf
Revises: 0007_agent_workflows
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0008_topic_discovery_okf"
down_revision: str | None = "0007_agent_workflows"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("concept_id", sa.String(length=500), nullable=False, server_default=""))
    op.add_column("documents", sa.Column("document_metadata", sa.JSON(), nullable=False, server_default="{}"))
    op.create_index("ix_documents_concept_id", "documents", ["concept_id"])

    op.create_table(
        "topic_discovery_rules",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("query", sa.String(length=300), nullable=False),
        sa.Column("provider", sa.String(length=24), nullable=False),
        sa.Column("search_range", sa.String(length=24), nullable=False),
        sa.Column("schedule", sa.String(length=24), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("auto_import", sa.Boolean(), nullable=False),
        sa.Column("score_threshold", sa.Integer(), nullable=False),
        sa.Column("max_items", sa.Integer(), nullable=False),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_employee_id", sa.String(length=16), nullable=False),
        sa.Column("created_by_name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("name", "schedule", "enabled", "next_run_at", "created_by_employee_id"):
        op.create_index(f"ix_topic_discovery_rules_{column}", "topic_discovery_rules", [column])

    op.create_table(
        "topic_discovery_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("rule_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("providers", sa.JSON(), nullable=False),
        sa.Column("found_count", sa.Integer(), nullable=False),
        sa.Column("imported_count", sa.Integer(), nullable=False),
        sa.Column("skipped_count", sa.Integer(), nullable=False),
        sa.Column("failures", sa.JSON(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["rule_id"], ["topic_discovery_rules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_topic_discovery_runs_rule_id", "topic_discovery_runs", ["rule_id"])
    op.create_index("ix_topic_discovery_runs_status", "topic_discovery_runs", ["status"])


def downgrade() -> None:
    op.drop_table("topic_discovery_runs")
    op.drop_table("topic_discovery_rules")
    op.drop_index("ix_documents_concept_id", table_name="documents")
    op.drop_column("documents", "document_metadata")
    op.drop_column("documents", "concept_id")
