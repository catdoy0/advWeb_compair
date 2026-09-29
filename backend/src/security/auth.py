from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWTError

from src.models.enums import UserRole
from src.security.tokens import decode_access_token


@dataclass(frozen=True)
class AccessPrincipal:
    user_id: int
    first_name: str | None
    last_name: str | None
    email: str
    role: UserRole


def get_current_user(request: Request) -> AccessPrincipal:
    """Authenticate from the access cookie without a database query."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        claims = decode_access_token(token)
        return AccessPrincipal(
            user_id=int(claims["sub"]),
            first_name=claims.get("first_name"),
            last_name=claims.get("last_name"),
            email=claims["email"],
            role=UserRole(claims["role"]),
        )
    except (PyJWTError, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        ) from None


def require_roles(*roles: UserRole):
    """Use as Depends(require_roles(UserRole.ADMIN, ...)) on protected routes."""
    def check_role(principal: AccessPrincipal = Depends(get_current_user)) -> AccessPrincipal:
        if principal.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return principal

    return check_role
