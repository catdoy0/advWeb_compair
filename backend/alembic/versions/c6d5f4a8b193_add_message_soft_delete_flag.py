"""add a soft-delete flag to messages

Revision ID: c6d5f4a8b193
Revises: ae4f5d1c7b20
Create Date: 2026-10-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c6d5f4a8b193"
down_revision: Union[str, Sequence[str], None] = "ae4f5d1c7b20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "messages",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    # Rows redacted by the older content-replacement implementation stay marked deleted.
    op.execute("UPDATE messages SET is_deleted = TRUE WHERE content = 'Deleted Message'")
    op.alter_column("messages", "is_deleted", server_default=None)


def downgrade() -> None:
    op.drop_column("messages", "is_deleted")
