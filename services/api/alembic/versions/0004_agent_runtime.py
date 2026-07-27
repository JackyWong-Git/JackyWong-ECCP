"""Create the governed Agent runtime.

Revision ID: 0004_agent_runtime
Revises: 0003_skill_registry
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = "0004_agent_runtime"
down_revision = "0003_skill_registry"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "agents",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False, unique=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("category", sa.String(40), nullable=False, server_default="content"),
        sa.Column("status", sa.String(24), nullable=False, server_default="active"),
        sa.Column("model_id", sa.String(80), nullable=False, server_default="deepseek-v4-pro"),
        sa.Column("routing_keywords", JSONB(), nullable=False, server_default="[]"),
        sa.Column("business_keys", JSONB(), nullable=False, server_default="[]"),
        sa.Column("current_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("run_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("success_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_employee_id", sa.String(16), nullable=False),
        sa.Column("created_by_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ("slug", "name", "category", "status", "last_run_at", "created_by_employee_id"):
        op.create_index(f"ix_agents_{column}", "agents", [column])

    op.create_table(
        "agent_versions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("agent_id", sa.Uuid(), sa.ForeignKey("agents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("system_prompt", sa.Text(), nullable=False),
        sa.Column("config", JSONB(), nullable=False, server_default="{}"),
        sa.Column("change_note", sa.String(300), nullable=False, server_default=""),
        sa.Column("created_by_employee_id", sa.String(16), nullable=False),
        sa.Column("created_by_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("agent_id", "version", name="uq_agent_versions_agent_version"),
    )
    op.create_index("ix_agent_versions_agent_id", "agent_versions", ["agent_id"])
    op.create_index("ix_agent_versions_created_at", "agent_versions", ["created_at"])

    op.create_table(
        "agent_skill_bindings",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("agent_id", sa.Uuid(), sa.ForeignKey("agents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill_id", sa.Uuid(), sa.ForeignKey("skill_packages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("regression_status", sa.String(24), nullable=False, server_default="passed"),
        sa.Column("bound_version", sa.String(80), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("agent_id", "skill_id", name="uq_agent_skill_bindings_agent_skill"),
    )
    op.create_index("ix_agent_skill_bindings_agent_id", "agent_skill_bindings", ["agent_id"])
    op.create_index("ix_agent_skill_bindings_skill_id", "agent_skill_bindings", ["skill_id"])
    op.create_index("ix_agent_skill_bindings_regression_status", "agent_skill_bindings", ["regression_status"])

    op.create_table(
        "agent_knowledge_bindings",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("agent_id", sa.Uuid(), sa.ForeignKey("agents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("knowledge_base_id", sa.Uuid(), sa.ForeignKey("knowledge_bases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("top_k", sa.Integer(), nullable=False, server_default="4"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("agent_id", "knowledge_base_id", name="uq_agent_knowledge_bindings_agent_kb"),
    )
    op.create_index("ix_agent_knowledge_bindings_agent_id", "agent_knowledge_bindings", ["agent_id"])
    op.create_index("ix_agent_knowledge_bindings_knowledge_base_id", "agent_knowledge_bindings", ["knowledge_base_id"])

    op.create_table(
        "agent_runs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("agent_id", sa.Uuid(), sa.ForeignKey("agents.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("agent_version_id", sa.Uuid(), sa.ForeignKey("agent_versions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("source", sa.String(24), nullable=False, server_default="assistant"),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("output_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("business_key", sa.String(80), nullable=False, server_default="general"),
        sa.Column("status", sa.String(32), nullable=False, server_default="running"),
        sa.Column("route_reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("model_id", sa.String(80), nullable=False, server_default="deepseek-v4-pro"),
        sa.Column("conversation_id", sa.String(120), nullable=False, server_default=""),
        sa.Column("error_message", sa.Text(), nullable=False, server_default=""),
        sa.Column("requested_by_employee_id", sa.String(16), nullable=False),
        sa.Column("requested_by_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ("agent_id", "agent_version_id", "source", "business_key", "status", "conversation_id", "requested_by_employee_id", "created_at"):
        op.create_index(f"ix_agent_runs_{column}", "agent_runs", [column])
    op.create_index("ix_agent_runs_requester_created", "agent_runs", ["requested_by_employee_id", "created_at"])

    op.create_table(
        "run_steps",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("run_id", sa.Uuid(), sa.ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("step_type", sa.String(32), nullable=False),
        sa.Column("name", sa.String(180), nullable=False),
        sa.Column("status", sa.String(24), nullable=False, server_default="pending"),
        sa.Column("skill_id", sa.Uuid(), sa.ForeignKey("skill_packages.id", ondelete="SET NULL"), nullable=True),
        sa.Column("knowledge_base_id", sa.Uuid(), sa.ForeignKey("knowledge_bases.id", ondelete="SET NULL"), nullable=True),
        sa.Column("input_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("output_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("step_metadata", JSONB(), nullable=False, server_default="{}"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("run_id", "ordinal", name="uq_run_steps_run_ordinal"),
    )
    for column in ("run_id", "step_type", "status", "skill_id", "knowledge_base_id"):
        op.create_index(f"ix_run_steps_{column}", "run_steps", [column])

    op.create_table(
        "approvals",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("run_id", sa.Uuid(), sa.ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("approval_type", sa.String(40), nullable=False, server_default="high_risk_skill"),
        sa.Column("status", sa.String(24), nullable=False, server_default="pending"),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("requested_by_employee_id", sa.String(16), nullable=False),
        sa.Column("requested_by_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("reviewed_by_employee_id", sa.String(16), nullable=False, server_default=""),
        sa.Column("reviewed_by_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("review_note", sa.Text(), nullable=False, server_default=""),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ("run_id", "approval_type", "status", "requested_by_employee_id", "reviewed_by_employee_id", "created_at"):
        op.create_index(f"ix_approvals_{column}", "approvals", [column])


def downgrade() -> None:
    op.drop_table("approvals")
    op.drop_table("run_steps")
    op.drop_table("agent_runs")
    op.drop_table("agent_knowledge_bindings")
    op.drop_table("agent_skill_bindings")
    op.drop_table("agent_versions")
    op.drop_table("agents")
