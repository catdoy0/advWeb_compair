from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Password_Reset(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True, max_length=64)
    code_hash: str = Field(max_length=64)
    expires_at: datetime
    attempts: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
