from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException
from src.models.enums import UserRole
from src.models.users import Users
from src.schemas.auth import LoginRequest, SignUpRequest
from src.security.passwords import hash_password, verify_password
from src.security.tokens import (
    JWT_AUDIENCE,
    JWT_ISSUER,
    create_access_token,
    decode_access_token,
)
from src.services import auth as auth_service


def test_password_hash_verifies_without_storing_plaintext():
    password = "Correct horse battery staple"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong password", hashed)
    assert not verify_password(password, "invalid-hash")


def test_access_token_contains_expected_user_claims_and_rejects_tampering():
    user = Users(
        id=42,
        first_name="Alex",
        last_name="Tester",
        email="alex@example.com",
        password_hash="unused",
        role=UserRole.TECHNICIAN,
    )

    token = create_access_token(user)
    claims = decode_access_token(token)

    assert claims["sub"] == "42"
    assert claims["role"] == "TECHNICIAN"
    assert claims["type"] == "access"
    assert claims["iss"] == JWT_ISSUER
    assert claims["aud"] == JWT_AUDIENCE
    token_parts = token.split(".")
    signature = token_parts[2]
    token_parts[2] = ("a" if signature[0] != "a" else "b") + signature[1:]
    with pytest.raises(jwt.PyJWTError):
        decode_access_token(".".join(token_parts))


def test_signup_rejects_password_confirmation_mismatch(monkeypatch):
    monkeypatch.setattr(auth_service.auth_sql, "email_exists", lambda _email: False)
    request = SignUpRequest(
        firstName="Alex",
        lastName="Tester",
        email="alex@example.com",
        password="password-one",
        confirm_password="password-two",
    )

    with pytest.raises(HTTPException) as error:
        auth_service.signup_user(request)

    assert error.value.status_code == 400


def test_signin_rejects_invalid_credentials(monkeypatch):
    user = Users(
        id=5,
        first_name="Alex",
        last_name="Tester",
        email="alex@example.com",
        password_hash=hash_password("correct"),
        role=UserRole.CUSTOMER,
    )
    monkeypatch.setattr(auth_service.auth_sql, "get_user_by_email", lambda _email: user)

    with pytest.raises(HTTPException) as error:
        auth_service.signin_user(LoginRequest(email="alex@example.com", password="wrong"))

    assert error.value.status_code == 401


def test_refresh_rejects_expired_session_and_deletes_it(monkeypatch):
    expired = type(
        "RefreshRow",
        (),
        {"id": 3, "expires_at": datetime.now(timezone.utc) - timedelta(seconds=1)},
    )()
    deleted = []
    monkeypatch.setattr(auth_service.auth_sql, "get_refresh_by_raw_token", lambda _token: expired)
    monkeypatch.setattr(auth_service.auth_sql, "delete_refresh", deleted.append)

    with pytest.raises(HTTPException) as error:
        auth_service.refresh_session("expired-token")

    assert error.value.status_code == 401
    assert deleted == [3]
