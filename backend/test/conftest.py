import os

import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine

# The application creates its production engine during import. Give test
# collection a harmless URL when developers have not configured a local .env.
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("JWT_SECRET", "test-only-secret-key-for-hmac-sha256")


@pytest.fixture
def auth_engine(monkeypatch):
    from src.models.refresh_sessions import Refresh_Session
    from src.models.users import Users
    from src.sql import auth as auth_sql

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine, tables=[Users.__table__, Refresh_Session.__table__]) # type: ignore
    monkeypatch.setattr(auth_sql, "engine", engine)
    yield engine
    engine.dispose()
