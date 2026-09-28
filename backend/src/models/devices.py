from datetime import datetime

from sqlmodel import Field, SQLModel

from src.models.enums import ComputerType


class Devices(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    customer_id: int = Field(
        foreign_key="users.id",
        index=True,
    )

    brand: str = Field(max_length=100)
    model: str = Field(max_length=150)

    serial_number: str | None = Field(
        default=None,
        max_length=150,
    )

    computer_type: ComputerType
    # computer_type: str = Field(max_length=50)

    created_at: datetime
    updated_at: datetime | None = None
