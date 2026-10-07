from fastapi import Request

from src.security.tokens import decode_access_token


def get_current_user_id(request: Request) -> int | None:
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        claims = decode_access_token(token)
        return int(claims["sub"])
    except Exception:
        return None
