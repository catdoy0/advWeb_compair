from pydantic import BaseModel, Field


class ChangeName(BaseModel):
    firstName: str = Field(max_length=72)
    lastName: str = Field(max_length=72)


class ChangeEmail(BaseModel):
    email: str
    currentPassword: str

class ChangePassword(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str
