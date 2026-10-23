import json
import logging
from typing import Any

from sqlalchemy import text
from sqlmodel import Session

from src.database import engine

logger = logging.getLogger(__name__)


def record_activity(
    actor_id: int | None,
    action: str,
    description: str,
    *,
    target_type: str | None = None,
    target_id: str | int | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    """Persist a human-readable audit entry without making the user action fail on log errors."""
    try:
        with Session(engine) as session:
            actor = None
            if actor_id is not None:
                actor = session.execute(
                    text("SELECT first_name, last_name, email, role FROM users WHERE id = :id"),
                    {"id": actor_id},
                ).mappings().first()

            actor_name = "Unknown user"
            actor_email = None
            actor_role = None
            if actor:
                actor_name = " ".join(
                    part for part in (actor["first_name"] or "", actor["last_name"] or "")
                    if part
                ).strip() or actor["email"]
                actor_email = actor["email"]
                actor_role = actor["role"].value if hasattr(actor["role"], "value") else str(actor["role"])

            session.execute(
                text("""
                    INSERT INTO activity_logs
                        (actor_id, actor_name, actor_email, actor_role, action, description,
                         target_type, target_id, details)
                    VALUES
                        (:actor_id, :actor_name, :actor_email, :actor_role, :action, :description,
                         :target_type, :target_id, CAST(:details AS JSONB))
                """),
                {
                    "actor_id": actor_id,
                    "actor_name": actor_name,
                    "actor_email": actor_email,
                    "actor_role": actor_role,
                    "action": action,
                    "description": description,
                    "target_type": target_type,
                    "target_id": str(target_id) if target_id is not None else None,
                    "details": json.dumps(details or {}, default=str),
                },
            )
            session.commit()
    except Exception:
        logger.exception("Failed to record activity log entry: %s", action)


def list_activity_logs(search: str, limit: int, offset: int) -> dict[str, Any]:
    query = search.strip().lower()
    pattern = f"%{query}%"
    with Session(engine) as session:
        total = session.execute(text("""
            SELECT COUNT(*)
            FROM activity_logs
            WHERE :query = ''
               OR LOWER(actor_name) LIKE :pattern
               OR LOWER(COALESCE(actor_email, '')) LIKE :pattern
               OR LOWER(action) LIKE :pattern
               OR LOWER(description) LIKE :pattern
               OR LOWER(COALESCE(target_type, '')) LIKE :pattern
               OR LOWER(COALESCE(target_id, '')) LIKE :pattern
        """), {"query": query, "pattern": pattern}).scalar_one()
        rows = session.execute(text("""
            SELECT id, actor_id, actor_name, actor_email, actor_role, action, description,
                   target_type, target_id, details, created_at
            FROM activity_logs
            WHERE :query = ''
               OR LOWER(actor_name) LIKE :pattern
               OR LOWER(COALESCE(actor_email, '')) LIKE :pattern
               OR LOWER(action) LIKE :pattern
               OR LOWER(description) LIKE :pattern
               OR LOWER(COALESCE(target_type, '')) LIKE :pattern
               OR LOWER(COALESCE(target_id, '')) LIKE :pattern
            ORDER BY created_at DESC, id DESC
            LIMIT :limit OFFSET :offset
        """), {
            "query": query,
            "pattern": pattern,
            "limit": limit,
            "offset": offset,
        }).mappings().all()

    return {"items": [dict(row) for row in rows], "total": total}
