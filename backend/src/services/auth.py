from datetime import datetime, timezone

from fastapi import HTTPException, status

from src.models.users import Users
from src.schemas.auth import LoginRequest, SignUpRequest
from src.security.passwords import hash_password, verify_password
from src.security.tokens import (
    create_access_token,
    create_refresh_token,
    refresh_expiry,
)
from src.sql import auth as auth_sql


def _utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def serialize_user(user: Users) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role.value,
    }


def _issue_token_pair(user: Users) -> tuple[str, str]:
    if user.id is None:
        raise RuntimeError("User ID was not generated")
    access_token = create_access_token(user)
    refresh_token = create_refresh_token()
    auth_sql.add_refresh(user.id, refresh_token, refresh_expiry())
    return access_token, refresh_token


def signup_user(data: SignUpRequest) -> tuple[Users, str, str]:
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if auth_sql.email_exists(data.email):
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = Users(
        first_name=data.firstName.strip(),
        last_name=data.lastName.strip(),
        email=data.email.lower().strip(),
        password_hash=hash_password(data.password),
    )
    user = auth_sql.add_user(user)
    auth_sql.delete_expired_refresh()

    if user.id:
        auth_sql.update_last_sign_in(user.id)

    access_token, refresh_token = _issue_token_pair(user)
    return user, access_token, refresh_token


def signin_user(data: LoginRequest) -> tuple[Users, str, str]:
    user = auth_sql.get_user_by_email(data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    auth_sql.delete_expired_refresh()

    if user.id:
        auth_sql.update_last_sign_in(user.id)

    access_token, refresh_token = _issue_token_pair(user)
    return user, access_token, refresh_token


def refresh_session(raw_token: str | None) -> tuple[Users, str]:
    if not raw_token:
        raise HTTPException(status_code=401, detail="Refresh token is missing")

    row = auth_sql.get_refresh_by_raw_token(raw_token)
    if not row or not row.id:
        raise HTTPException(status_code=401, detail="Refresh token is not recognized")

    if _utc(row.expires_at) <= datetime.now(timezone.utc):
        auth_sql.delete_refresh(row.id)
        raise HTTPException(status_code=401, detail="Refresh token is expired")

    user = auth_sql.get_user_by_id(row.user_id)
    if not user or not user.is_active:
        auth_sql.delete_refresh(row.id)
        raise HTTPException(status_code=401, detail="Account is unavailable")

    auth_sql.update_refresh_expiry(row.id, refresh_expiry())
    access_token = create_access_token(user)
    return user, access_token


def revoke_refresh_token(raw_token: str | None) -> None:
    if not raw_token:
        return
    row = auth_sql.get_refresh_by_raw_token(raw_token)
    if row and row.id:
        auth_sql.delete_refresh(row.id)
