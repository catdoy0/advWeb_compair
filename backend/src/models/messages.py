from datetime import datetime

from sqlmodel import Field, SQLModel


class Messages(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    conversation_id: int = Field(
        foreign_key="conversations.id",
        index=True,
    )

    sender_id: int = Field(
        foreign_key="users.id",
        index=True,
    )

    content: str

    created_at: datetime
