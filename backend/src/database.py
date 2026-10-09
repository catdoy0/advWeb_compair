from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, create_engine, select

from src.config import DATABASE_URL
from src.models.enums import UserRole
from src.models.users import Users

_database_url = DATABASE_URL or ""

engine = create_engine(_database_url, echo=False)


def get_session():
    with Session(engine) as session:
        yield session


def assert_database_ready() -> bool:
    try:
        with engine.connect() as conn:
            inspector = inspect(conn)
            tables = inspector.get_table_names()

    except SQLAlchemyError:
        print("[db] Can't connect to database.")
        return False

    if "users" not in tables:
        print("[db] 'users' table not found.")
        return False

    print("[db] Connected.")
    return True


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
