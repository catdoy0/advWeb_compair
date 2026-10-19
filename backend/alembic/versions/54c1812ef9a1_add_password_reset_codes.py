"""add password reset codes

Revision ID: 54c1812ef9a1
Revises: e8ea9c39644c
Create Date: 2026-10-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = "54c1812ef9a1"
down_revision: Union[str, Sequence[str], None] = "e8ea9c39644c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column("code_hash", sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column("expires_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("created_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_password_reset_user_id", "password_reset", ["user_id"])
    op.create_index("ix_password_reset_token_hash", "password_reset", ["token_hash"])


def downgrade() -> None:
    op.drop_index("ix_password_reset_token_hash", table_name="password_reset")
    op.drop_index("ix_password_reset_user_id", table_name="password_reset")
    op.drop_table("password_reset")
