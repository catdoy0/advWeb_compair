import os

from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

FORGET_PASS_EMAIL = os.getenv("FORGET_PASS_EMAIL")
FORGET_PASS_EMAIL_APP_PASS = os.getenv("FORGET_PASS_EMAIL_APP_PASS")

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

PRODUCTION = os.getenv("PRODUCTION")
IS_PRODUCTION: bool = False
if PRODUCTION == "TRUE":
    IS_PRODUCTION = True

COOKIE_OPTIONS = {
    "httponly": True,
    "secure": IS_PRODUCTION,
    "samesite": "none" if IS_PRODUCTION else "lax",
}


def validate_config():
    required = {
        "DATABASE_URL": DATABASE_URL,
        "JWT_SECRET": JWT_SECRET,
    }

    missing = []

    for name, value in required.items():
        if not value:
            missing.append(name)

    if missing:
        raise RuntimeError(
            "Missing required environment variables: "
            + ", ".join(missing)
        )



limiter = Limiter(key_func=get_remote_address)
