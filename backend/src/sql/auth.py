from datetime import datetime, timezone

from sqlmodel import Session, col, delete, func, select

from src.database import engine
from src.models.refresh_sessions import Refresh_Session
from src.models.users import Users
from src.security.tokens import hash_refresh_token


def get_user_by_email(email: str) -> Users | None:
    with Session(engine) as s:
        return s.exec(
            select(Users).where(func.lower(Users.email) == email.strip().lower())
        ).first()


def get_user_by_id(user_id: int) -> Users | None:
    with Session(engine) as s:
        return s.get(Users, user_id)


def email_exists(email: str) -> bool:
    with Session(engine) as s:
        return s.exec(
            select(Users).where(func.lower(Users.email) == email.strip().lower())
        ).first() is not None


def add_user(user: Users) -> Users:
    with Session(engine) as s:
        s.add(user)
        s.commit()
        s.refresh(user)
        return user



def get_refresh_by_raw_token(raw_token: str) -> Refresh_Session | None:
    with Session(engine) as s:
        return s.exec(
            select(Refresh_Session).where(
                Refresh_Session.token_hash == hash_refresh_token(raw_token)
            )
        ).first()


def add_refresh(user_id: int, token: str, expires_at: datetime) -> None:
    with Session(engine) as s:
        s.add(
            Refresh_Session(
                user_id=user_id,
                token_hash=hash_refresh_token(token),
                expires_at=expires_at,
            )
        )
        s.commit()


def delete_refresh(row_id: int) -> None:
    with Session(engine) as s:
        row = s.get(Refresh_Session, row_id)
        if row:
            s.delete(row)
            s.commit()


def update_refresh_expiry(row_id: int, new_expiry: datetime) -> None:
    with Session(engine) as s:
        row = s.get(Refresh_Session, row_id)
        if row:
            row.expires_at = new_expiry
            s.commit()


def delete_expired_refresh() -> None:
    with Session(engine) as s:
        s.exec(
            delete(Refresh_Session).where(
                col(Refresh_Session.expires_at) <= datetime.now(timezone.utc)
            )
        )

        s.commit()

def update_last_sign_in(user_id: int) -> None:
    with Session(engine) as s:
        user = s.get(Users, user_id)
        if user:
            user.last_sign_in = datetime.now(timezone.utc)
            s.commit()
