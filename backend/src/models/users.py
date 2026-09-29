from datetime import datetime, timezone

from sqlmodel import Field, SQLModel

from src.models.enums import UserRole


class Users(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    first_name: str | None = Field(default=None, max_length=72)
    last_name: str | None = Field(default=None, max_length=72)

    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)

    oauth_provider: str | None = Field(default=None, max_length=50)
    oauth_id: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=500)

    role: UserRole = Field(default=UserRole.CUSTOMER)
    is_active: bool = Field(default=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    updated_at: datetime | None = None
