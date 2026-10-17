from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from src.models.enums import UserRole
from src.models.users import Users
from src.sql import auth as auth_sql


def make_user(email="alex@example.com"):
    return Users(
        first_name="Alex",
        last_name="Tester",
        email=email,
        password_hash="not-a-real-hash",
        role=UserRole.CUSTOMER,
    )


def test_auth_tables_keep_required_columns_and_refresh_foreign_key(auth_engine):
    inspector = inspect(auth_engine)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    refresh_columns = {
        column["name"] for column in inspector.get_columns("refresh_session")
    }

    assert {"id", "email", "password_hash", "role", "is_active", "last_sign_in"} <= user_columns
    assert {"id", "user_id", "token_hash", "expires_at", "created_at"} <= refresh_columns
    assert inspector.get_unique_constraints("users") or any(
        index["unique"] and "email" in index["column_names"]
        for index in inspector.get_indexes("users")
    )
    foreign_keys = inspector.get_foreign_keys("refresh_session")
    assert any(
        fk["constrained_columns"] == ["user_id"]
        and fk["referred_table"] == "users"
        and fk["referred_columns"] == ["id"]
        for fk in foreign_keys
    )


def test_user_email_is_unique_in_database(auth_engine):
    auth_sql.add_user(make_user())

    with pytest.raises(IntegrityError):
        auth_sql.add_user(make_user())


def test_refresh_tokens_are_hashed_and_can_be_looked_up(auth_engine):
    user = auth_sql.add_user(make_user())
    token = "opaque-refresh-token"
    expires = datetime.now(timezone.utc) + timedelta(days=1)

    auth_sql.add_refresh(user.id, token, expires) # type: ignore

    session = auth_sql.get_refresh_by_raw_token(token)
    assert session is not None
    assert session.user_id == user.id
    assert session.token_hash != token
    assert auth_sql.get_refresh_by_raw_token("different-token") is None


def test_expired_refresh_sessions_are_removed(auth_engine):
    user = auth_sql.add_user(make_user())
    token = "expired-refresh-token"
    auth_sql.add_refresh(user.id, token, datetime.now(timezone.utc) - timedelta(seconds=1)) # type: ignore

    auth_sql.delete_expired_refresh()

    assert auth_sql.get_refresh_by_raw_token(token) is None


def test_email_lookup_is_case_insensitive_and_email_exists_includes_inactive_users(auth_engine):
    auth_sql.add_user(make_user("Alex@Example.com"))
    inactive = make_user("inactive@example.com")
    inactive.is_active = False
    auth_sql.add_user(inactive)

    assert auth_sql.email_exists(" alex@example.COM ")
    assert auth_sql.get_user_by_email("ALEX@example.com") is not None
    assert auth_sql.email_exists("inactive@example.com")
    assert auth_sql.get_user_by_email("inactive@example.com") is None
