from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class Repair_Parts(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    repair_id: int = Field(
        foreign_key="repairs.id",
        index=True,
    )

    part_id: int = Field(
        foreign_key="parts.id",
        index=True,
    )

    quantity_used: int = Field(default=1)

    unit_price: Decimal = Field(
        decimal_places=2,
        max_digits=12,
    )

    work_note: str | None = None

    created_at: datetime
