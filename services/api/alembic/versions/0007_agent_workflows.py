"""add persisted multi-agent workflows

Revision ID: 0007_agent_workflows
Revises: 0006_model_providers
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0007_agent_workflows"
down_revision: str | None = "0006_model_providers"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "agent_workflows",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("collaboration_mode", sa.String(length=40), nullable=False),
        sa.Column("agent_ids", sa.JSON(), nullable=False),
        sa.Column("finalizer_enabled", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_by_employee_id", sa.String(length=16), nullable=False),
        sa.Column("created_by_name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_workflows_name", "agent_workflows", ["name"])
    op.create_index("ix_agent_workflows_collaboration_mode", "agent_workflows", ["collaboration_mode"])
    op.create_index("ix_agent_workflows_status", "agent_workflows", ["status"])
    op.create_index("ix_agent_workflows_created_by_employee_id", "agent_workflows", ["created_by_employee_id"])
    op.create_index("ix_agent_workflows_created_at", "agent_workflows", ["created_at"])


def downgrade() -> None:
    op.drop_table("agent_workflows")
