from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, col, select

from src.database import engine
from src.models.enums import NotificationType, UserRole
from src.models.notifications import Notifications
from src.models.users import Users


def _now() -> datetime:
    return datetime.now(timezone.utc)


def get_team_user_ids() -> list[int]:
    """Everyone who is not a customer — the recipients of a new-request notification."""
    with Session(engine) as s:
        rows = s.exec(
            select(Users.id)
            .where(Users.role != UserRole.CUSTOMER)
            .where(Users.is_active == True)  # noqa: E712
        ).all()

    return [row for row in rows if row is not None]


def create_notifications(
    user_ids: list[int],
    type: NotificationType,
    title: str,
    body: str | None,
    link: str | None,
    reference_id: int | None,
) -> list[Notifications]:
    """Bulk-insert one row per recipient."""
    with Session(engine) as s:
        rows: list[Notifications] = []
        for uid in user_ids:
            row = Notifications(
                user_id=uid,
                type=type,
                title=title,
                body=body,
                link=link,
                reference_id=reference_id,
            )
            s.add(row)
            rows.append(row)

        s.commit()

        for row in rows:
            s.refresh(row)

        return rows


def list_for_user(user_id: int, limit: int = 30) -> list[Notifications]:
    with Session(engine) as s:
        return list(
            s.exec(
                select(Notifications)
                .where(Notifications.user_id == user_id)
                .order_by(col(Notifications.created_at).desc())
                .limit(limit)
            ).all()
        )


def count_unread(user_id: int) -> int:
    with Session(engine) as s:
        return s.execute(
            text("""
                SELECT COUNT(*)
                FROM notifications
                WHERE user_id = :uid AND is_read = false
            """),
            {"uid": user_id},
        ).scalar_one()


def mark_read(notification_id: int, user_id: int) -> bool:
    with Session(engine) as s:
        row = s.get(Notifications, notification_id)
        if row is None or row.user_id != user_id:
            return False

        row.is_read = True
        row.read_at = _now()
        s.commit()
        return True


def mark_all_read(user_id: int) -> None:
    with Session(engine) as s:
        s.execute(
            text("""
                UPDATE notifications
                SET is_read = true, read_at = :now
                WHERE user_id = :uid AND is_read = false
            """),
            {"now": _now(), "uid": user_id},
        )
        s.commit()
