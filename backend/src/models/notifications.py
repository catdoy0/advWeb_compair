from datetime import datetime, timezone

from sqlmodel import Field, SQLModel

from src.models.enums import NotificationType


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Notifications(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="users.id", index=True)

    type: NotificationType = Field(index=True)

    title: str = Field(max_length=200)
    body: str | None = None
    link: str | None = Field(default=None, max_length=500)

    # context — e.g. repair_request_id, appointment_id
    reference_id: int | None = Field(default=None)

    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=_now, index=True)
    read_at: datetime | None = None
