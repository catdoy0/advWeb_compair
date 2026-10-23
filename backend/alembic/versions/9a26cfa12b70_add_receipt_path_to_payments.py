"""add receipt path to payments

Revision ID: 9a26cfa12b70
Revises: 54c1812ef9a1
Create Date: 2026-10-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9a26cfa12b70"
down_revision: Union[str, Sequence[str], None] = "54c1812ef9a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("payments", sa.Column("receipt_path", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("payments", "receipt_path")
