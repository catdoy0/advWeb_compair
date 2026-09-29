import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from src.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from src.models.users import Users

JWT_ISSUER = "adv-web-backend"
JWT_AUDIENCE = "adv-web-frontend"
REFRESH_TOKEN_BYTES = 96


def _jwt_secret() -> str:
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is required")
    return JWT_SECRET


def create_access_token(user: Users) -> str:
    """Create a signed, short-lived token with the UI's basic user claims."""
    if user.id is None:
        raise ValueError("Cannot issue a token for a user without an ID")

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": user.role.value,
        "type": "access",
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(
        payload,
        _jwt_secret(),
        algorithm=JWT_ALGORITHM,
        headers={"typ": "at+jwt"},
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """Verify the signature and required claims before returning the payload."""
    if jwt.get_unverified_header(token).get("typ") != "at+jwt":
        raise jwt.InvalidTokenError("Unexpected token type")
    payload = jwt.decode(
        token,
        _jwt_secret(),
        algorithms=[JWT_ALGORITHM],
        issuer=JWT_ISSUER,
        audience=JWT_AUDIENCE,
        options={"require": ["sub", "type", "role", "iat", "exp", "iss", "aud"]},
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Expected an access token")
    if not isinstance(payload.get("sub"), str) or not payload["sub"].isdecimal():
        raise jwt.InvalidTokenError("Invalid token subject")
    return payload


def create_refresh_token() -> str:
    """Return a random opaque refresh token; it contains no user claims."""
    return secrets.token_urlsafe(REFRESH_TOKEN_BYTES)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("ascii")).hexdigest()


def refresh_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
