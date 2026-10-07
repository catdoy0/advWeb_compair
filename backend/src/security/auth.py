from fastapi import HTTPException, Request, Response
from jwt import PyJWTError

from src.config import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from src.models.users import UserRole
from src.security.tokens import decode_access_token
from src.services.auth import refresh_session
from src.sql import auth as auth_sql

ACCESS_MAX_AGE = ACCESS_TOKEN_EXPIRE_MINUTES * 60
REFRESH_MAX_AGE = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


def check_user_role(
    request: Request,
    response: Response,
    allowed_roles: list[UserRole],
) -> bool:

    access_token = request.cookies.get("access_token")

    if access_token:
        try:
            claims = decode_access_token(access_token)
            # role = UserRole(claims["role"])
            # return role in allowed_roles

            user_id = int(claims["sub"])
            user = auth_sql.get_user_by_id(user_id)
            if user is not None and user.role.value == claims["role"]:
                return user.role in allowed_roles

        except (PyJWTError, KeyError, TypeError, ValueError):
            pass

    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        return False

    try:
        user, new_access_token = refresh_session(refresh_token)
    except HTTPException:
        return False

    response.set_cookie(
        "access_token",
        new_access_token,
        max_age=ACCESS_MAX_AGE,
        path="/",
        httponly=True,
        secure=False,
        samesite="lax",
    )

    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=REFRESH_MAX_AGE,
        path="/",
        httponly=True,
        secure=False,
        samesite="lax",
    )

    return user.role in allowed_roles
