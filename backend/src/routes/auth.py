from fastapi import APIRouter, HTTPException, Request, Response
from jwt import PyJWTError

from src.config import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from src.schemas.auth import CheckEmailRequest, LoginRequest, SignUpRequest
from src.security.tokens import decode_access_token
from src.services.auth import (
    refresh_session,
    revoke_refresh_token,
    serialize_user,
    signin_user,
    signup_user,
)
from src.sql import auth as auth_sql

router = APIRouter()


COOKIE_OPTIONS = {
    "httponly": True,
    "secure": False,
    "samesite": "lax",
}

ACCESS_MAX_AGE = ACCESS_TOKEN_EXPIRE_MINUTES * 60
REFRESH_MAX_AGE = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


def _set_access_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        "access_token", access_token,
        max_age=ACCESS_MAX_AGE, path="/", **COOKIE_OPTIONS,
    )


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        "refresh_token", refresh_token,
        max_age=REFRESH_MAX_AGE, path="/", **COOKIE_OPTIONS,
    )


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    _set_access_cookie(response, access_token)
    _set_refresh_cookie(response, refresh_token)


@router.post("/signup")
def signup(data: SignUpRequest, response: Response):
    user, access_token, refresh_token = signup_user(data)
    _set_auth_cookies(response, access_token, refresh_token)
    return {"user": serialize_user(user)}


@router.post("/signin")
def signin(data: LoginRequest, response: Response):
    user, access_token, refresh_token = signin_user(data)
    _set_auth_cookies(response, access_token, refresh_token)
    return {"user": serialize_user(user)}


@router.post("/session")
def check_session(response: Response, request: Request):
    access_token = request.cookies.get("access_token")

    if access_token:
        try:
            claims = decode_access_token(access_token)
            user_id = int(claims["sub"])
            user = auth_sql.get_user_by_id(user_id)

            if user is not None and user.role.value == claims["role"]:
                return {"user": serialize_user(user)}
        except (PyJWTError, KeyError, TypeError, ValueError):
            pass

    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token is missing")

    user, new_access = refresh_session(refresh_token)
    _set_access_cookie(response, new_access)
    _set_refresh_cookie(response, refresh_token)
    return {"user": serialize_user(user)}


@router.post("/logout")
def logout(response: Response, request: Request):
    revoke_refresh_token(request.cookies.get("refresh_token"))
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@router.post("/check-email-taken")
def check_email_taken(data: CheckEmailRequest):
    return {
        "email": data.email,
        "taken": auth_sql.email_exists(data.email),
    }
