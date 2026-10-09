from datetime import date, datetime, time, timezone

from sqlmodel import Field, SQLModel

from src.models.enums import AppointmentStatus


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Appointments(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    repair_request_id: int = Field(
        foreign_key="repair_requests.id",
        index=True,
    )

    scheduled_date: date
    scheduled_time: time

    status: AppointmentStatus = Field(
        default=AppointmentStatus.PENDING,
        index=True,
    )

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime | None = None
