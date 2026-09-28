from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class Parts(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(max_length=150)

    sku: str = Field(
        max_length=100,
        unique=True,
        index=True,
    )

    category: str = Field(max_length=100)

    quantity: int = Field(default=0)

    unit_price: Decimal = Field(
        decimal_places=2,
        max_digits=12,
    )

    created_at: datetime
    updated_at: datetime | None = None
