from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlmodel import Session

from src.database import get_session
from src.models.users import Users
from src.schemas.auth import LoginRequest, SignUpRequest
from src.security.jwt import create_access_token, create_refresh_token, decode_token
from src.services.auth import authenticate_user, require_user_id, signup_user

SessionDep = Annotated[Session, Depends(get_session)]

router = APIRouter()

cookie_setting = {
    "httponly": True,
    "secure": False,
    "samesite": "lax",
}


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    data: SignUpRequest,
    session: SessionDep,
):
    user = signup_user(session, data)

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role,
            }
    }


@router.post("/signin")
def signin(
    data: LoginRequest,
    response: Response,
    session: SessionDep,
):
    user = authenticate_user(session, data)

    user_id = require_user_id(user)

    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=15 * 60,
        path="/",
        **cookie_setting,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=7 * 24 * 60 * 60,
        path="/auth",
        **cookie_setting,
    )

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role,
            }
    }


@router.post("/refresh")
def refresh(response: Response, request: Request, session: SessionDep):
    token = request.cookies.get("refresh_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token",
        )

    try:
        payload = decode_token(token)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = int(user_id)

    user = session.get(Users, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )

    access_token = create_access_token(user_id)

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=15 * 60,
        path="/",
        **cookie_setting,
    )

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "role": user.role,
            }
    }


@router.post("/logout")
def logout(response: Response):

    response.delete_cookie(
        key="access_token",
        path="/",
    )

    response.delete_cookie(
        key="refresh_token",
        path="/auth",
    )

    return {
        "message": "Logged out"
    }
