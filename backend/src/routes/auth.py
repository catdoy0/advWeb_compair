import secrets

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Response
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from jwt import PyJWTError

from src.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    COOKIE_OPTIONS,
    FORGET_PASS_EMAIL,
    FORGET_PASS_EMAIL_APP_PASS,
    GOOGLE_CLIENT_ID,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from src.models.users import UserRole
from src.schemas.auth import (
    CheckEmailRequest,
    GoogleSignInRequest,
    LoginRequest,
    PasswordResetCodeRequest,
    PasswordResetRequest,
    PasswordResetSendCodeRequest,
    SignUpRequest,
)
from src.schemas.store_settings import StoreSettings
from src.security.auth import check_user_role, send_reset_pass
from src.security.tokens import (
    create_password_reset_token,
    decode_access_token,
    decode_password_reset_token,
)
from src.services.auth import (
    refresh_session,
    revoke_refresh_token,
    serialize_user,
    signin_google_user,
    signin_user,
    signup_user,
)
from src.services.store_settings import (
    read_settings,
    serialize_store_settings,
    write_settings,
)
from src.sql import auth as auth_sql
from src.sql import password_reset as password_reset_sql

router = APIRouter()




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


@router.get("/store-settings")
def get_store_settings():
    return serialize_store_settings(read_settings())


@router.put("/store-settings")
def update_store_settings(
    data: StoreSettings,
    request: Request,
    response: Response,
):
    if not check_user_role(request, response, [UserRole.SUPER_ADMIN, UserRole.ADMIN]):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update store settings",
        )

    write_settings(data)
    return serialize_store_settings(read_settings())


@router.post("/forget-password-sendcode")
def forget_password_sendcode(
    data: PasswordResetSendCodeRequest,
    background_tasks: BackgroundTasks,
    response: Response,
):
    if not FORGET_PASS_EMAIL or not FORGET_PASS_EMAIL_APP_PASS:
        raise HTTPException(status_code=503, detail="Password reset email is not configured")

    email = str(data.email).strip().lower()
    user = auth_sql.get_user_by_email(email)
    if user is None or user.id is None:
        raise HTTPException(status_code=404, detail="No account found for this email")

    token = secrets.token_urlsafe(32)
    code = f"{secrets.randbelow(900_000) + 100_000:06d}"
    response.set_cookie(
        key="reset_pass",
        value=token,
        max_age=60 * 60,
        path="/",
        **COOKIE_OPTIONS,
    )

    password_reset_sql.create_reset_request(user.id, token, code)
    background_tasks.add_task(send_reset_pass, email, code)

    return {"message": "Reset code sent."}


@router.post("/reset-password")
def reset_password(data: PasswordResetRequest, response: Response):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    try:
        claims = decode_password_reset_token(data.reset_token)
        user_id = int(claims["sub"])
    except (PyJWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if not password_reset_sql.reset_user_password(
        user_id, claims["email"], data.reset_token, data.password
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    user, access_token, refresh_token = signin_user(
        LoginRequest(email=claims["email"], password=data.password)
    )
    _set_auth_cookies(response, access_token, refresh_token)
    return {
        "message": "Password reset successfully",
        "user": serialize_user(user),
        "store_settings": serialize_store_settings(read_settings()),
    }


@router.post("/verify-reset-code")
def verify_reset_code(data: PasswordResetCodeRequest, request: Request, response: Response):
    cookie_token = request.cookies.get("reset_pass")
    if not cookie_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    email = str(data.email).strip().lower()
    user = password_reset_sql.get_reset_user(email, cookie_token)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    reset_jwt, expires_at = create_password_reset_token(user)
    if not password_reset_sql.verify_reset_code_and_store_jwt(
        email, cookie_token, data.code, reset_jwt, expires_at
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    response.delete_cookie("reset_pass", path="/")
    return {"reset_token": reset_jwt, "expires_in": 300}


@router.post("/signup")
def signup(data: SignUpRequest, response: Response):
    user, access_token, refresh_token = signup_user(data)
    _set_auth_cookies(response, access_token, refresh_token)
    store_settings = read_settings()
    return {
        "user": serialize_user(user),
        "store_settings": serialize_store_settings(store_settings)
    }


@router.post("/signin")
def signin(data: LoginRequest, response: Response):
    user, access_token, refresh_token = signin_user(data)
    _set_auth_cookies(response, access_token, refresh_token)
    store_settings = read_settings()
    return {
        "user": serialize_user(user),
        "store_settings": serialize_store_settings(store_settings)
    }


@router.post("/google")
def google_signin(data: GoogleSignInRequest, response: Response):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")

    try:
        claims = id_token.verify_oauth2_token(
            data.credential,
            GoogleRequest(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google credential")
    except GoogleAuthError:
        raise HTTPException(status_code=503, detail="Could not verify Google credential")

    if claims.get("email_verified") is not True:
        raise HTTPException(status_code=401, detail="Google email is not verified")

    user, access_token, refresh_token = signin_google_user(claims) # type: ignore
    _set_auth_cookies(response, access_token, refresh_token)
    return {
        "user": serialize_user(user),
        "store_settings": serialize_store_settings(read_settings()),
    }


@router.post("/session")
def check_session(response: Response, request: Request):
    access_token = request.cookies.get("access_token")

    if access_token:
        try:
            claims = decode_access_token(access_token)
            user_id = int(claims["sub"])
            user = auth_sql.get_user_by_id(user_id)

            store_settings = read_settings()
            if (
                user is not None
                and user.archived_at is None
                and user.is_active
                and user.role.value == claims["role"]
            ):
                return {
                    "user": serialize_user(user),
                    "store_settings": serialize_store_settings(store_settings)
                }
            # The account role or active state may have changed since this access
            # token was issued. Fall through to the refresh-token check below so
            # an eligible account receives a fresh token with its current role.
        except (PyJWTError, KeyError, TypeError, ValueError):
            pass

    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token is missing")

    user, new_access = refresh_session(refresh_token)
    _set_access_cookie(response, new_access)
    _set_refresh_cookie(response, refresh_token)
    return {
        "user": serialize_user(user),
        "store_settings": serialize_store_settings(read_settings()),
    }


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
