from datetime import datetime, timezone
from typing import Any

from sqlalchemy import BigInteger, Column, DateTime, Index, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class ActivityLogs(SQLModel, table=True):
    __tablename__ = "activity_logs" # type: ignore
    __table_args__ = (
        Index(
            "ix_activity_logs_created_at",
            text("created_at DESC"),
            text("id DESC"),
        ),
        Index("ix_activity_logs_actor_id", "actor_id"),
    )

    id: int | None = Field(
        default=None,
        sa_column=Column(BigInteger, primary_key=True, autoincrement=True),
    )
    actor_id: int | None = Field(default=None)
    actor_name: str = Field(default="Unknown user", max_length=200)
    actor_email: str | None = Field(default=None, max_length=255)
    actor_role: str | None = Field(default=None, max_length=40)
    action: str = Field(max_length=80)
    description: str = Field(sa_type=Text)
    target_type: str | None = Field(default=None, max_length=80)
    target_id: str | None = Field(default=None, max_length=120)
    details: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(
            JSONB,
            nullable=False,
            server_default=text("'{}'::jsonb"),
        ),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
    )
