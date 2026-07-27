"""add encrypted model provider configuration

Revision ID: 0006_model_providers
Revises: 0005_update_default_agent_model
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0006_model_providers"
down_revision: str | None = "0005_update_default_agent_model"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "model_providers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("provider_key", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("base_url", sa.String(length=600), nullable=False),
        sa.Column("default_model", sa.String(length=120), nullable=False),
        sa.Column("api_key_ciphertext", sa.Text(), nullable=False),
        sa.Column("api_key_hint", sa.String(length=24), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=False),
        sa.Column("last_tested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_employee_id", sa.String(length=16), nullable=False),
        sa.Column("created_by_name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_model_providers_provider_key", "model_providers", ["provider_key"], unique=True)
    op.create_index("ix_model_providers_name", "model_providers", ["name"])
    op.create_index("ix_model_providers_enabled", "model_providers", ["enabled"])
    op.create_index("ix_model_providers_is_default", "model_providers", ["is_default"])
    op.create_index("ix_model_providers_status", "model_providers", ["status"])
    op.create_index("ix_model_providers_created_by_employee_id", "model_providers", ["created_by_employee_id"])


def downgrade() -> None:
    op.drop_table("model_providers")
