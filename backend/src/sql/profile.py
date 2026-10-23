from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from src.database import engine
from src.models.users import Users
from src.schemas.profile import ChangeEmail, ChangeName, ChangePassword
from src.security.passwords import hash_password, verify_password

NAME_CHANGE_INTERVAL = timedelta(days=7)


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def change_name(user_id: int, change_name: ChangeName) -> dict:
    first_name = change_name.firstName.strip()
    last_name = change_name.lastName.strip()
    if not first_name:
        return {"success": False, "status_code": 422, "message": "First name is required."}

    with Session(engine) as s:
        user = s.get(Users, user_id)
        if user is None:
            return {"success": False, "status_code": 404, "message": "Account not found."}

        current_first = user.first_name or ""
        current_last = user.last_name or ""
        available_at = (
            _as_utc(user.name_updated_at) + NAME_CHANGE_INTERVAL
            if user.name_updated_at is not None
            else None
        )
        if first_name == current_first and last_name == current_last:
            return {
                "success": True,
                "changed": False,
                "message": "Your name is already up to date.",
                "available_at": available_at,
            }

        now = datetime.now(timezone.utc)
        if available_at is not None and now < available_at:
            return {
                "success": False,
                "status_code": 429,
                "message": "You can change your name again after the seven-day cooldown.",
                "available_at": available_at,
            }

        user.first_name = first_name
        user.last_name = last_name or None
        user.name_updated_at = now
        user.updated_at = now
        s.add(user)
        s.commit()
        return {
            "success": True,
            "changed": True,
            "message": "Your name was updated.",
            "available_at": now + NAME_CHANGE_INTERVAL,
        }


def change_email(user_id: int, change_email: ChangeEmail):
    try:
        with Session(engine) as s:
            user = s.get(Users, user_id)
            if user is None:
                return {"success": False, "message": "User not found"}

            if not verify_password(change_email.currentPassword, user.password_hash):
                return {"success": False, "message": "Current password is incorrect"}

            s.execute(
                text("""
                    UPDATE users
                    SET email = :email, updated_at = :updated_at
                    WHERE id = :user_id
                """),
                {
                    "email": change_email.email,
                    "updated_at": datetime.now(timezone.utc),
                    "user_id": user_id,
                },
            )
            s.commit()
            return {"success": True, "message": "Email updated successfully"}

    except SQLAlchemyError as e:
        print(f"change_email failed: {e}")
        return {"success": False, "message": "An error occurred while updating email"}


def change_password(user_id: int, changePassword: ChangePassword):
    try:
        with Session(engine) as s:
            user = s.get(Users, user_id)
            if user is None:
                return {"success": False, "message": "User not found"}

            if not verify_password(changePassword.currentPassword, user.password_hash):
                return {"success": False, "message": "Current password is incorrect"}

            new_hash = hash_password(changePassword.newPassword)

            s.execute(
                text("""
                    UPDATE users
                    SET password_hash = :password_hash, updated_at = :updated_at
                    WHERE id = :user_id
                """),
                {
                    "password_hash": new_hash,
                    "updated_at": datetime.now(timezone.utc),
                    "user_id": user_id,
                },
            )
            s.commit()
            return {"success": True, "message": "Password updated successfully"}

    except SQLAlchemyError as e:
        print(f"change_password failed: {e}")
        return {"success": False, "message": "An error occurred while updating password"}


def set_avatar_url(user_id: int, avatar_url: str) -> bool:
    with Session(engine) as s:
        user = s.get(Users, user_id)
        if user is None:
            return False
        user.avatar_url = avatar_url
        user.updated_at = datetime.now(timezone.utc)
        s.add(user)
        s.commit()
        return True
