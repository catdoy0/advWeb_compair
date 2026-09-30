from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import update
from sqlmodel import Session, col, func, select

from src.models.refresh_sessions import Refresh_Session
from src.models.users import Users
from src.schemas.auth import LoginRequest, SignUpRequest
from src.security.passwords import hash_password, verify_password
from src.security.tokens import (
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    refresh_expiry,
)


def serialize_user(user: Users) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "role": user.role.value,
    }


def _store_refresh_token(session: Session, user_id: int, token: str) -> None:
    session.add(
        Refresh_Session(
            user_id=user_id,
            token_hash=hash_refresh_token(token),
            expires_at=refresh_expiry(),
        )
    )


def _issue_token_pair(session: Session, user: Users) -> tuple[str, str]:
    if user.id is None:
        raise RuntimeError("User ID was not generated")
    access_token = create_access_token(user)
    refresh_token = create_refresh_token()
    _store_refresh_token(session, user.id, refresh_token)
    return access_token, refresh_token


def signup_user(
    session: Session,
    data: SignUpRequest,
) -> tuple[Users, str, str]:
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing = session.exec(select(Users).where(Users.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = Users(
        first_name=data.firstName.strip(),
        last_name=data.lastName.strip(),
        email=data.email.lower().strip(),
        password_hash=hash_password(data.password),
    )
    session.add(user)
    session.flush()
    access_token, refresh_token = _issue_token_pair(session, user)
    session.commit()
    return user, access_token, refresh_token


def signin_user(
    session: Session,
    data: LoginRequest,
) -> tuple[Users, str, str]:
    email = data.email.strip().lower()

    user = session.exec(
        select(Users).where(
            func.lower(Users.email) == email
        )
    ).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    access_token, refresh_token = _issue_token_pair(session, user)
    session.commit()
    return user, access_token, refresh_token


def rotate_refresh_token(
    session: Session,
    raw_token: str | None,
) -> tuple[Users, str, str]:
    if not raw_token:
        raise HTTPException(status_code=401, detail="Refresh token is missing")

    token_hash = hash_refresh_token(raw_token)
    row = session.exec(
        select(Refresh_Session).where(Refresh_Session.token_hash == token_hash)
    ).first()
    if not row:
        raise HTTPException(status_code=401, detail="Refresh token is not recognized")

    if row.revoked:
        _revoke_all_sessions(session, row.user_id)
        session.commit()
        raise HTTPException(status_code=401, detail="Refresh token reuse detected")

    now = datetime.now(timezone.utc)
    expires_at = row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        raise HTTPException(status_code=401, detail="Refresh token is expired")

    result = session.exec(
        update(Refresh_Session)
        .where(
            col(Refresh_Session.id) == row.id,
            col(Refresh_Session.revoked).is_(False),
            col(Refresh_Session.expires_at) > now,
        )
        .values(revoked=True)
    )
    if result.rowcount != 1:
        session.refresh(row)
        if row.revoked:
            _revoke_all_sessions(session, row.user_id)
            session.commit()
            raise HTTPException(status_code=401, detail="Refresh token reuse detected")
        raise HTTPException(status_code=401, detail="Refresh token is expired")

    user = session.get(Users, row.user_id)
    if not user or not user.is_active:
        session.commit()
        raise HTTPException(status_code=401, detail="Account is unavailable")

    access_token, new_refresh_token = _issue_token_pair(session, user)
    session.commit()
    return user, access_token, new_refresh_token


def _revoke_all_sessions(session: Session, user_id: int) -> None:
    session.exec(
        update(Refresh_Session)
        .where(col(Refresh_Session.user_id) == user_id)
        .values(revoked=True)
    )


def revoke_refresh_token(session: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    row = session.exec(
        select(Refresh_Session).where(
            Refresh_Session.token_hash == hash_refresh_token(raw_token)
        )
    ).first()
    if row and not row.revoked:
        row.revoked = True
        session.commit()
