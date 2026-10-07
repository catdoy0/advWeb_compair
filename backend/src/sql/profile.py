from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from src.database import engine
from src.models.users import Users
from src.schemas.profile import ChangeEmail, ChangePassword
from src.security.passwords import hash_password, verify_password


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
