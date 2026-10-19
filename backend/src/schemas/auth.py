from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignUpRequest(BaseModel):
    lastName: str
    firstName: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("email")
    @classmethod
    def email_must_be_deliverable(cls, value: str) -> str:
        try:
            result = validate_email(value, check_deliverability=False)
        except EmailNotValidError as exc:
            raise ValueError(str(exc)) from exc

        return result.normalized

class CheckEmailRequest(BaseModel):
    email: EmailStr


class PasswordResetSendCodeRequest(BaseModel):
    email: EmailStr


class PasswordResetCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class PasswordResetRequest(BaseModel):
    reset_token: str
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class GoogleSignInRequest(BaseModel):
    credential: str = Field(min_length=100)
