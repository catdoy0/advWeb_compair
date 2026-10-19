import hashlib
import hmac
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, delete, select

from src.database import engine
from src.models.password_reset import Password_Reset
from src.models.refresh_sessions import Refresh_Session
from src.models.users import Users
from src.security.passwords import hash_password
from src.security.tokens import hash_refresh_token

RESET_CODE_TTL = timedelta(hours=1)
MAX_RESET_ATTEMPTS = 5


def _hash_code(token: str, code: str) -> str:
    return hashlib.sha256(f"{token}:{code}".encode("utf-8")).hexdigest()


def create_reset_request(user_id: int, token: str, code: str) -> None:
    with Session(engine) as session:
        session.exec(delete(Password_Reset).where(Password_Reset.user_id == user_id))
        session.add(Password_Reset(
            user_id=user_id,
            token_hash=hash_refresh_token(token),
            code_hash=_hash_code(token, code),
            expires_at=datetime.now(timezone.utc) + RESET_CODE_TTL,
        ))
        session.commit()


def get_reset_user(email: str, token: str) -> Users | None:
    cleaned_email = email.strip().lower()
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        reset = session.exec(
            select(Password_Reset).where(
                Password_Reset.token_hash == hash_refresh_token(token)
            )
        ).first()
        if reset is None:
            return None

        # SQLite may return a naive datetime even when the column is timezone aware.
        expires_at = reset.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= now or reset.attempts >= MAX_RESET_ATTEMPTS:
            session.delete(reset)
            session.commit()
            return None

        user = session.get(Users, reset.user_id)
        if user is None or user.email.strip().lower() != cleaned_email:
            return None
        return user


def verify_reset_code_and_store_jwt(
    email: str,
    cookie_token: str,
    code: str,
    reset_jwt: str,
    expires_at: datetime,
) -> bool:
    cleaned_email = email.strip().lower()
    with Session(engine) as session:
        reset = session.exec(
            select(Password_Reset).where(
                Password_Reset.token_hash == hash_refresh_token(cookie_token)
            )
        ).first()
        if reset is None:
            return False

        current_expiry = reset.expires_at
        if current_expiry.tzinfo is None:
            current_expiry = current_expiry.replace(tzinfo=timezone.utc)
        user = session.get(Users, reset.user_id)
        if current_expiry <= datetime.now(timezone.utc) or reset.attempts >= MAX_RESET_ATTEMPTS:
            session.delete(reset)
            session.commit()
            return False

        valid_code = hmac.compare_digest(reset.code_hash, _hash_code(cookie_token, code))
        if user is None or user.email.strip().lower() != cleaned_email or not valid_code:
            reset.attempts += 1
            if reset.attempts >= MAX_RESET_ATTEMPTS:
                session.delete(reset)
            session.commit()
            return False

        reset.token_hash = hash_refresh_token(reset_jwt)
        reset.code_hash = ""
        reset.expires_at = expires_at
        reset.attempts = 0
        session.commit()
        return True


def reset_user_password(user_id: int, email: str, token: str, password: str) -> bool:
    cleaned_email = email.strip().lower()
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        reset = session.exec(
            select(Password_Reset).where(
                Password_Reset.token_hash == hash_refresh_token(token),
                Password_Reset.user_id == user_id,
                Password_Reset.code_hash == "",
            )
        ).first()
        if reset is None:
            return False

        expires_at = reset.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        user = session.get(Users, user_id)
        if expires_at <= now or user is None or user.email.strip().lower() != cleaned_email:
            session.delete(reset)
            session.commit()
            return False

        user.password_hash = hash_password(password)
        session.add(user)
        session.delete(reset)
        # A password reset signs out existing sessions on all devices.
        session.exec(delete(Refresh_Session).where(Refresh_Session.user_id == user.id))
        session.commit()
        return True
