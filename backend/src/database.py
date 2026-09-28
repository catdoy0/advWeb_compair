from sqlmodel import Session, create_engine

from src.config import DATABASE_URL

_database_url = DATABASE_URL or ""

engine = create_engine( _database_url, echo=True,)

def get_session():
    with Session(engine) as session:
        yield session
