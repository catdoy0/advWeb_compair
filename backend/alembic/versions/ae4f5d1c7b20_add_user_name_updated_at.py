"""add dedicated timestamp for profile name changes

Revision ID: ae4f5d1c7b20
Revises: 9a26cfa12b70
Create Date: 2026-10-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "ae4f5d1c7b20"
down_revision: Union[str, Sequence[str], None] = "9a26cfa12b70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("name_updated_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "name_updated_at")
