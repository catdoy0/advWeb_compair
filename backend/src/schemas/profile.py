from pydantic import BaseModel


class ChangeEmail(BaseModel):
    email: str
    currentPassword: str

class ChangePassword(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str
