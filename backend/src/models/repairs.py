from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class Repairs(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    repair_request_id: int = Field(
        foreign_key="repair_requests.id",
        unique=True,
        index=True,
    )

    technician_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        index=True,
    )

    diagnosis: str | None = None

    estimate_amount: Decimal | None = Field(
        default=None,
        decimal_places=2,
        max_digits=12,
    )

    final_amount: Decimal | None = Field(
        default=None,
        decimal_places=2,
        max_digits=12,
    )

    started_at: datetime | None = None
    completed_at: datetime | None = None

    created_at: datetime
    updated_at: datetime | None = None
