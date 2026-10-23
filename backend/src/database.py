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


def ensure_archive_columns() -> None:
    """Add the soft-archive timestamps to existing databases, safely on startup."""
    with engine.begin() as conn:
        conn.exec_driver_sql(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ"
        )
        conn.exec_driver_sql(
            "ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ"
        )
        conn.exec_driver_sql("""
            UPDATE conversations c
            SET archived_at = NULL
            WHERE c.archived_at IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM repair_requests rr
                  WHERE rr.id = c.repair_request_id
                    AND rr.status IN ('COMPLETED', 'RELEASED', 'REJECTED')
              )
        """)


def ensure_activity_log_table() -> None:
    """Create the append-only audit log table when upgrading existing databases."""
    with engine.begin() as conn:
        conn.exec_driver_sql("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id BIGSERIAL PRIMARY KEY,
                actor_id INTEGER NULL,
                actor_name VARCHAR(200) NOT NULL DEFAULT 'Unknown user',
                actor_email VARCHAR(255) NULL,
                actor_role VARCHAR(40) NULL,
                action VARCHAR(80) NOT NULL,
                description TEXT NOT NULL,
                target_type VARCHAR(80) NULL,
                target_id VARCHAR(120) NULL,
                details JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)
        conn.exec_driver_sql(
            "ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(40)"
        )
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_activity_logs_created_at ON activity_logs (created_at DESC, id DESC)"
        )
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS ix_activity_logs_actor_id ON activity_logs (actor_id)"
        )


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
