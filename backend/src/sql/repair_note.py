from datetime import datetime, timezone

from sqlalchemy import text
from sqlmodel import Session, select

from src.database import engine
from src.models.repair_notes import Repair_Notes
from src.models.repairs import Repairs


def _now() -> datetime:
    return datetime.now(timezone.utc)


def get_or_create_repair(repair_request_id: int) -> Repairs | None:
    """Get the repairs row for a request, creating an empty one if missing."""
    with Session(engine) as s:
        existing = s.exec(
            select(Repairs).where(Repairs.repair_request_id == repair_request_id)
        ).first()
        if existing is not None:
            return existing

        repair = Repairs(repair_request_id=repair_request_id)
        s.add(repair)
        s.commit()
        s.refresh(repair)
        return repair


def create_note(repair_id: int, author_id: int, note: str) -> Repair_Notes:
    with Session(engine) as s:
        row = Repair_Notes(
            repair_id=repair_id,
            author_id=author_id,
            note=note,
        )
        s.add(row)
        s.commit()
        s.refresh(row)
        return row


def list_notes(repair_id: int) -> list[dict]:
    with Session(engine) as s:
        rows = s.execute(
            text("""
                SELECT
                    n.id,
                    n.note,
                    n.created_at,
                    n.author_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.role
                FROM repair_notes n
                JOIN users u ON u.id = n.author_id
                WHERE n.repair_id = :rid
                ORDER BY n.created_at DESC
            """),
            {"rid": repair_id},
        ).mappings().all()

    result = []
    for row in rows:
        author_name = " ".join(
            p for p in [row["first_name"], row["last_name"]] if p
        ).strip() or row["email"]

        result.append({
            "id": row["id"],
            "note": row["note"],
            "created_at": row["created_at"],
            "author_id": row["author_id"],
            "author_name": author_name,
            "author_role": row["role"],
        })

    return result
