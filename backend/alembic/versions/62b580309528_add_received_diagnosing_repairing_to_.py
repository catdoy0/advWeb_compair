"""add received diagnosing repairing to repair_request_status

Revision ID: 62b580309528
Revises: be905ade1f38
Create Date: 2026-10-10 13:13:51.934078

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '62b580309528'
down_revision: Union[str, Sequence[str], None] = 'be905ade1f38'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("COMMIT")
    op.execute("ALTER TYPE repairrequeststatus ADD VALUE IF NOT EXISTS 'RECEIVED'")
    op.execute("ALTER TYPE repairrequeststatus ADD VALUE IF NOT EXISTS 'DIAGNOSING'")
    op.execute("ALTER TYPE repairrequeststatus ADD VALUE IF NOT EXISTS 'REPAIRING'")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
