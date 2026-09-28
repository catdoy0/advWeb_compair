from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel

from src.models.enums import PaymentMethod, PaymentStatus


class Payments(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    repair_id: int = Field(
        foreign_key="repairs.id",
        index=True,
    )

    amount: Decimal = Field(
        decimal_places=2,
        max_digits=12,
    )

    payment_method: PaymentMethod = Field(
        default=PaymentMethod.CASH,
    )

    status: PaymentStatus = Field(
        default=PaymentStatus.PAID,
    )

    processed_by: int = Field(
        foreign_key="users.id",
        index=True,
    )

    paid_at: datetime | None = None
    created_at: datetime
