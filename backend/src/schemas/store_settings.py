from pydantic import BaseModel, EmailStr, Field, field_validator

DEFAULT_AVAILABLE_TIMES = [f"{hour:02d}:00" for hour in range(24)]
DEFAULT_AVAILABLE_DAYS = list(range(1, 8))


class StoreSettings(BaseModel):
    email: EmailStr
    number: str = Field(min_length=3, max_length=30)
    available_times: list[str] = Field(
        default_factory=lambda: DEFAULT_AVAILABLE_TIMES.copy(),
        min_length=1,
    )
    available_days: list[int] = Field(
        default_factory=lambda: DEFAULT_AVAILABLE_DAYS.copy(),
        min_length=1,
    )

    @field_validator("email", "number", mode="before")
    @classmethod
    def trim_values(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("available_times")
    @classmethod
    def validate_available_times(cls, values: list[str]) -> list[str]:
        selected = set(values)
        invalid = selected.difference(DEFAULT_AVAILABLE_TIMES)
        if invalid:
            raise ValueError("Appointment times must be hourly slots from 00:00 to 23:00.")
        return [slot for slot in DEFAULT_AVAILABLE_TIMES if slot in selected]

    @field_validator("available_days")
    @classmethod
    def validate_available_days(cls, values: list[int]) -> list[int]:
        selected = set(values)
        if selected.difference(DEFAULT_AVAILABLE_DAYS):
            raise ValueError("Appointment days must be ISO weekdays from 1 to 7.")
        return [day for day in DEFAULT_AVAILABLE_DAYS if day in selected]
