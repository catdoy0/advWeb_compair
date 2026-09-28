from datetime import date, datetime, time

from sqlmodel import Field, SQLModel

from src.models.enums import RepairRequestStatus


class Repair_Requests(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    repair_number: str = Field(
        max_length=50,
        unique=True,
        index=True,
    )

    customer_id: int = Field(
        foreign_key="users.id",
        index=True,
    )

    device_id: int = Field(
        foreign_key="devices.id",
        index=True,
    )

    requested_service: str = Field(max_length=255)

    reported_problem: str

    preferred_date: date
    preferred_time: time

    status: RepairRequestStatus = Field(
        default=RepairRequestStatus.PENDING,
        index=True,
    )

    created_at: datetime
    updated_at: datetime | None = None
