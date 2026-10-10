from decimal import Decimal

from pydantic import BaseModel, Field


class CreatePartRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    sku: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=100)
    quantity: int = Field(ge=0, default=0)
    reorder_threshold: int = Field(ge=0, default=5)
    unit_price: Decimal = Field(ge=0)
    supplier: str | None = Field(default=None, max_length=150)


class UpdatePartRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    reorder_threshold: int | None = Field(default=None, ge=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    supplier: str | None = Field(default=None, max_length=150)


class RestockPartRequest(BaseModel):
    amount: int = Field(gt=0)
