"""Update legacy default Agent model identifiers.

Revision ID: 0005_update_default_agent_model
Revises: 0004_agent_runtime
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_update_default_agent_model"
down_revision = "0004_agent_runtime"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE agents
            SET model_id = 'gpt-5.4'
            WHERE slug IN (
                'employee-story',
                'material-screening',
                'content-review',
                'topic-planning',
                'performance-review',
                'multi-channel'
            )
              AND model_id IN ('deepseek-v4-pro', 'gpt-5.6-terra')
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE agents
            SET model_id = 'deepseek-v4-pro'
            WHERE slug IN (
                'employee-story',
                'material-screening',
                'content-review',
                'topic-planning',
                'performance-review',
                'multi-channel'
            )
              AND model_id = 'gpt-5.4'
            """
        )
    )
