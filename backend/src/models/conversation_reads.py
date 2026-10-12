from datetime import datetime, timezone

from sqlmodel import Field, SQLModel, UniqueConstraint


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Conversation_Reads(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_conversation_read"),
    )

    id: int | None = Field(default=None, primary_key=True)

    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    last_read_message_id: int | None = Field(default=None)

    updated_at: datetime = Field(default_factory=_now)
