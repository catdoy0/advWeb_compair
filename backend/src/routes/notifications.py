from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from src.services.auth import require_active_user as _require_user
from src.sql import notification as notif_sql

router = APIRouter()


class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    body: str | None
    link: str | None
    reference_id: int | None
    is_read: bool
    created_at: str


@router.get("")
def list_notifications(
    request: Request,
    limit: int = Query(30, ge=1, le=100),
):
    user = _require_user(request)
    rows = notif_sql.list_for_user(user.id, limit) # type: ignore

    return [
        {
            "id": r.id,
            "type": r.type.value,
            "title": r.title,
            "body": r.body,
            "link": r.link,
            "reference_id": r.reference_id,
            "is_read": r.is_read,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/unread-count")
def unread_count(request: Request):
    user = _require_user(request)
    return {"count": notif_sql.count_unread(user.id)} # type: ignore


@router.post("/{notification_id}/read")
def mark_read(notification_id: int, request: Request):
    user = _require_user(request)

    ok = notif_sql.mark_read(notification_id, user.id) # type: ignore
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"ok": True}


@router.post("/read-all")
def mark_all_read(request: Request):
    user = _require_user(request)
    notif_sql.mark_all_read(user.id)  # type: ignore
    return {"ok": True}
