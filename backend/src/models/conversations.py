from datetime import datetime

from sqlmodel import Field, SQLModel


class Conversations(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    customer_id: int = Field(
        foreign_key="users.id",
        unique=True,
        index=True,
    )

    created_at: datetime
    updated_at: datetime | None = None
