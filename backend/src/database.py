import sys

from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, create_engine, select

from src.config import DATABASE_URL
from src.models.enums import UserRole
from src.models.users import Users

_database_url = DATABASE_URL or ""

engine = create_engine(_database_url, echo=True)


def get_session():
    with Session(engine) as session:
        yield session


def assert_database_ready() -> None:
    """
    Verify the DB is reachable and the `users` table exists.
    Exits the process if not.
    """
    try:
        with engine.connect() as conn:
            inspector = inspect(conn)
            tables = inspector.get_table_names()
    except SQLAlchemyError as exc:
        print(f"[db] FATAL: could not connect to database: {exc}", file=sys.stderr)
        sys.exit(1)

    if "users" not in tables:
        print(
            f"[db] FATAL: 'users' table not found. Existing tables: {tables}",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"[db] Connected. Tables: {tables}")


DEFAULT_ROOT_EMAIL = "compair@gmail.com"
DEFAULT_ROOT_PASSWORD = "root"


def ensure_default_super_admin() -> None:
    """
    Create a default SUPER_ADMIN 'root' user if no super admin exists yet.
    Safe to call on every startup.
    """
    from src.security.passwords import hash_password

    with Session(engine) as session:
        existing = session.exec(
            select(Users).where(Users.role == UserRole.SUPER_ADMIN)
        ).first()

        if existing is not None:
            return

        root = Users(
            first_name="root",
            last_name=None,
            email=DEFAULT_ROOT_EMAIL,
            password_hash=hash_password(DEFAULT_ROOT_PASSWORD),
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        session.add(root)
        session.commit()
        print(f"[seed] Created default super admin: {DEFAULT_ROOT_EMAIL}")
