from datetime import date, datetime, time, timezone

from sqlmodel import Field, SQLModel

from src.models.enums import RepairRequestStatus


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Repair_Requests(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    repair_number: str = Field(max_length=50, unique=True, index=True)

    customer_id: int = Field(foreign_key="users.id", index=True)
    device_id: int = Field(foreign_key="devices.id", index=True)

    contact_detail: str | None = Field(default=None, max_length=255)

    requested_service: str = Field(max_length=255)
    reported_problem: str

    preferred_date: date
    preferred_time: time

    status: RepairRequestStatus = Field(
        default=RepairRequestStatus.PENDING,
        index=True,
    )

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime | None = None
