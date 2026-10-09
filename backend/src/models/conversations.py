from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Conversations(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    customer_id: int = Field(
        foreign_key="users.id",
        index=True,
    )

    repair_request_id: int | None = Field(
        default=None,
        foreign_key="repair_requests.id",
        unique=True,
        index=True,
    )

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_message_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
