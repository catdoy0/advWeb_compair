from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Repair_Notes(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    repair_id: int = Field(foreign_key="repairs.id", index=True)

    author_id: int = Field(foreign_key="users.id", index=True)

    note: str

    created_at: datetime = Field(default_factory=_now)
