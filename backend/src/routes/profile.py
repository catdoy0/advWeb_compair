from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, HTTPException, Request, Response

from src.schemas.profile import ChangeEmail, ChangePassword
from src.services.auth import get_current_user_id
from src.sql import profile as profile_sql
from src.sql.auth import email_exists

router = APIRouter()

@router.post("/change-email")
def change_email(
    request: Request,
    response: Response,
    changeEmail: ChangeEmail
):
    try:
        validate_email(changeEmail.email, check_deliverability=False)
    except EmailNotValidError:
        raise HTTPException(status_code=400, detail="Invalid email format")
    if email_exists(changeEmail.email):
        raise HTTPException(status_code=409, detail="Email is already registered")

    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    message = profile_sql.change_email(user_id, changeEmail)

    if not message["success"]:
        raise HTTPException(status_code=400, detail=message["message"])

    return {"success": True, "message": message["message"]}


@router.post("/change-password")
def change_password(
    request: Request,
    response: Response,
    changePassword: ChangePassword
):
    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if changePassword.newPassword != changePassword.confirmPassword:
        raise HTTPException(
            status_code=400,
            detail="New password and confirm password do not match",
        )

    message = profile_sql.change_password(user_id, changePassword)

    if not message["success"]:
        raise HTTPException(status_code=400, detail=message["message"])

    return {"success": True, "message": message["message"]}
