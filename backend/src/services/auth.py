from fastapi import HTTPException, status
from sqlmodel import Session, select

from src.models.users import Users
from src.schemas.auth import LoginRequest, SignUpRequest
from src.security.password import hash_password, verify_password


def require_user_id(user: Users) -> int:
    if user.id is None:
        raise RuntimeError("User ID was not generated")

    return user.id


def signup_user(session: Session, data: SignUpRequest) -> Users:
    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    existing_user = session.exec(
        select(Users).where(Users.email == data.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    user = Users(
        email=data.email,
        password_hash=hash_password(data.password),
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    if user.id is None:
        raise RuntimeError("User ID was not generated")

    return user


def authenticate_user(
    session: Session,
    data: LoginRequest,
) -> Users:

    user = session.exec(
        select(Users).where(Users.email == data.email)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    return user
