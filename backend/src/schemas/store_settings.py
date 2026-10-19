from pydantic import BaseModel, EmailStr, Field, field_validator


class StoreSettings(BaseModel):
    email: EmailStr
    number: str = Field(min_length=3, max_length=30)

    @field_validator("email", "number", mode="before")
    @classmethod
    def trim_values(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value
