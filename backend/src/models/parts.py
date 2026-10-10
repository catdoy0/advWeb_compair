from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Parts(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(max_length=150)
    sku: str = Field(max_length=100, unique=True, index=True)
    category: str = Field(max_length=100, index=True)

    quantity: int = Field(default=0)
    reorder_threshold: int = Field(default=5)
    unit_price: Decimal = Field(decimal_places=2, max_digits=12)

    supplier: str | None = Field(default=None, max_length=150)

    is_active: bool = Field(default=True, index=True)

    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime | None = None
