from datetime import datetime, timezone

from sqlmodel import Field, SQLModel

from src.models.enums import ComputerType


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Devices(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    customer_id: int = Field(foreign_key="users.id", index=True)

    computer_name: str = Field(max_length=150)
    serial_number: str | None = Field(default=None, max_length=150)

    computer_type: ComputerType

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime | None = None
