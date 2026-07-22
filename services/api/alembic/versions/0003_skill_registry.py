"""Create the governed skill registry.

Revision ID: 0003_skill_registry
Revises: 0002_content_workflow
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = "0003_skill_registry"
down_revision = "0002_content_workflow"
branch_labels = None
depends_on = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "skill_sources",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("source_type", sa.String(24), nullable=False, server_default="github"),
        sa.Column("repository_url", sa.String(1000), nullable=False),
        sa.Column("owner", sa.String(120), nullable=False, server_default=""),
        sa.Column("repository", sa.String(160), nullable=False, server_default=""),
        sa.Column("git_ref", sa.String(240), nullable=False, server_default="main"),
        sa.Column("status", sa.String(24), nullable=False, server_default="active"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_scanned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_employee_id", sa.String(16), nullable=False),
        sa.Column("created_by_name", sa.String(80), nullable=False, server_default=""),
        *timestamps(),
        sa.UniqueConstraint("repository_url", "git_ref", name="uq_skill_sources_repo_ref"),
    )
    op.create_index("ix_skill_sources_name", "skill_sources", ["name"])
    op.create_index("ix_skill_sources_status", "skill_sources", ["status"])

    op.create_table(
        "skill_packages",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("source_id", sa.Uuid(), sa.ForeignKey("skill_sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("slug", sa.String(180), nullable=False),
        sa.Column("name", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("category", sa.String(80), nullable=False, server_default="通用能力"),
        sa.Column("author", sa.String(160), nullable=False, server_default=""),
        sa.Column("skill_path", sa.String(600), nullable=False),
        sa.Column("homepage", sa.String(1000), nullable=False, server_default=""),
        sa.Column("license", sa.String(80), nullable=False, server_default=""),
        sa.Column("risk_level", sa.String(16), nullable=False, server_default="low"),
        sa.Column("risk_findings", JSONB(), nullable=False, server_default="[]"),
        sa.Column("capabilities", JSONB(), nullable=False, server_default="[]"),
        sa.Column("required_env", JSONB(), nullable=False, server_default="[]"),
        sa.Column("required_bins", JSONB(), nullable=False, server_default="[]"),
        sa.Column("suggested_businesses", JSONB(), nullable=False, server_default="[]"),
        sa.Column("deprecated_by", sa.String(180), nullable=False, server_default=""),
        sa.Column("latest_version", sa.String(80), nullable=False, server_default="0.0.0"),
        sa.Column("latest_commit_sha", sa.String(64), nullable=False, server_default=""),
        sa.Column("manifest", JSONB(), nullable=False, server_default="{}"),
        *timestamps(),
        sa.UniqueConstraint("source_id", "skill_path", name="uq_skill_packages_source_path"),
    )
    op.create_index("ix_skill_packages_source_id", "skill_packages", ["source_id"])
    op.create_index("ix_skill_packages_slug", "skill_packages", ["slug"])
    op.create_index("ix_skill_packages_name", "skill_packages", ["name"])
    op.create_index("ix_skill_packages_category", "skill_packages", ["category"])
    op.create_index("ix_skill_packages_risk_level", "skill_packages", ["risk_level"])

    op.create_table(
        "skill_releases",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("skill_id", sa.Uuid(), sa.ForeignKey("skill_packages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("version", sa.String(80), nullable=False, server_default="0.0.0"),
        sa.Column("commit_sha", sa.String(64), nullable=False, server_default=""),
        sa.Column("checksum", sa.String(64), nullable=False),
        sa.Column("manifest", JSONB(), nullable=False, server_default="{}"),
        sa.Column("discovered_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("skill_id", "checksum", name="uq_skill_releases_skill_checksum"),
    )
    op.create_index("ix_skill_releases_skill_id", "skill_releases", ["skill_id"])
    op.create_index("ix_skill_releases_discovered_at", "skill_releases", ["discovered_at"])

    op.create_table(
        "skill_installations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("skill_id", sa.Uuid(), sa.ForeignKey("skill_packages.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("release_id", sa.Uuid(), sa.ForeignKey("skill_releases.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(24), nullable=False, server_default="active"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("preflight_status", sa.String(24), nullable=False, server_default="not_run"),
        sa.Column("preflight_result", JSONB(), nullable=False, server_default="{}"),
        sa.Column("config", JSONB(), nullable=False, server_default="{}"),
        sa.Column("installed_by_employee_id", sa.String(16), nullable=False),
        sa.Column("installed_by_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("installed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_skill_installations_skill_id", "skill_installations", ["skill_id"])
    op.create_index("ix_skill_installations_release_id", "skill_installations", ["release_id"])
    op.create_index("ix_skill_installations_status", "skill_installations", ["status"])

    op.create_table(
        "skill_bindings",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("skill_id", sa.Uuid(), sa.ForeignKey("skill_packages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("business_key", sa.String(80), nullable=False),
        sa.Column("business_name", sa.String(120), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("config", JSONB(), nullable=False, server_default="{}"),
        *timestamps(),
        sa.UniqueConstraint("skill_id", "business_key", name="uq_skill_bindings_skill_business"),
    )
    op.create_index("ix_skill_bindings_skill_id", "skill_bindings", ["skill_id"])
    op.create_index("ix_skill_bindings_business_key", "skill_bindings", ["business_key"])

    op.create_table(
        "skill_audit_logs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("skill_id", sa.Uuid(), sa.ForeignKey("skill_packages.id", ondelete="SET NULL"), nullable=True),
        sa.Column("source_id", sa.Uuid(), sa.ForeignKey("skill_sources.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("status", sa.String(24), nullable=False, server_default="success"),
        sa.Column("detail", sa.Text(), nullable=False, server_default=""),
        sa.Column("event_metadata", JSONB(), nullable=False, server_default="{}"),
        sa.Column("actor_employee_id", sa.String(16), nullable=False),
        sa.Column("actor_name", sa.String(80), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_skill_audit_logs_skill_id", "skill_audit_logs", ["skill_id"])
    op.create_index("ix_skill_audit_logs_source_id", "skill_audit_logs", ["source_id"])
    op.create_index("ix_skill_audit_logs_action", "skill_audit_logs", ["action"])
    op.create_index("ix_skill_audit_logs_status", "skill_audit_logs", ["status"])
    op.create_index("ix_skill_audit_logs_created_at", "skill_audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("skill_audit_logs")
    op.drop_table("skill_bindings")
    op.drop_table("skill_installations")
    op.drop_table("skill_releases")
    op.drop_table("skill_packages")
    op.drop_table("skill_sources")
