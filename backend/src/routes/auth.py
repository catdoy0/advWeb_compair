from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from jwt import PyJWTError
from sqlmodel import Session, func, select

from src.config import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from src.database import get_session
from src.models.users import Users
from src.schemas.auth import CheckEmailRequest, LoginRequest, SignUpRequest
from src.security.auth import get_current_user
from src.security.tokens import decode_access_token
from src.services.auth import (
    revoke_refresh_token,
    rotate_refresh_token,
    serialize_user,
    signin_user,
    signup_user,
)

SessionDep = Annotated[Session, Depends(get_session)]
router = APIRouter()


COOKIE_OPTIONS = {
    "httponly": True,
    "secure": False,
    "samesite": "lax",
}


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        "access_token",
        access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        **COOKIE_OPTIONS,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth",
        **COOKIE_OPTIONS,
    )


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(data: SignUpRequest, response: Response, session: SessionDep):
    user, access_token, refresh_token = signup_user(session, data)
    _set_auth_cookies(response, access_token, refresh_token)
    return {"user": serialize_user(user)}


@router.post("/signin")
def signin(data: LoginRequest, response: Response, session: SessionDep):
    user, access_token, refresh_token = signin_user(session, data)
    _set_auth_cookies(response, access_token, refresh_token)
    return {"user": serialize_user(user)}


@router.post("/session")
def check_session(response: Response, request: Request, session: SessionDep):
    access_token = request.cookies.get("access_token")
    if access_token:
        try:
            claims = decode_access_token(access_token)
            user = get_current_user(request)
            return {
                "user": {
                    "id": int(claims["sub"]),
                    "email": user.email.lower().strip(),
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "role": user.role.value,
                }
            }
        except (PyJWTError, HTTPException, KeyError, TypeError, ValueError):
            pass

    user, new_access, new_refresh = rotate_refresh_token(
        session,
        request.cookies.get("refresh_token"),
    )
    _set_auth_cookies(response, new_access, new_refresh)
    return {"user": serialize_user(user)}


@router.post("/logout")
def logout(response: Response, request: Request, session: SessionDep):
    revoke_refresh_token(session, request.cookies.get("refresh_token"))
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/auth")
    return {"message": "Logged out"}


@router.post("/check-email-taken")
def check_email_taken(data: CheckEmailRequest, session: SessionDep):
    taken = session.exec(
        select(Users).where(
            func.lower(Users.email) == data.email.strip().lower()
        )
    ).first() is not None
    return {"email": data.email, "taken": taken}
