from fastapi import APIRouter, HTTPException, Query, Request

from src.events import broadcaster
from src.models.users import UserRole
from src.schemas.conversation import (
    SendMessageRequest,
)
from src.services.auth import require_active_user as _require_user
from src.sql import conversation as conv_sql

router = APIRouter()



def _full_name(user) -> str:
    parts = [user.first_name or "", user.last_name or ""]
    name = " ".join(p for p in parts if p).strip()
    return name or user.email



@router.get("/")
def list_conversations(
    request: Request,
    search: str = Query(default="", max_length=200),
    limit: int = Query(default=10, ge=1, le=10),
    offset: int = Query(default=0, ge=0),
):
    user = _require_user(request)

    if user.role == UserRole.CUSTOMER and user.id is not None:
        conv_sql.get_or_create_general_conversation(user.id)
        page = conv_sql.search_conversations_for_customer(
            user.id, search, limit, offset,
        )
    else:
        page = conv_sql.search_conversations_for_team(
            user.id, search, limit, offset,  # type: ignore[arg-type]
        )

    result = []
    for row in page["items"]:
        result.append({
            "id": row["id"],
            "customer_id": row["customer_id"],
            "repair_request_id": row["repair_request_id"],
            "last_message_at": row["last_message_at"],
            "customer_name": None,
            "customer_email": None,
            "repair_number": row["repair_number"],
            "repair_status": row["repair_status"],
            "device_label": row["computer_name"],
            "preview": row["last_message"],
            "unread_count": row["unread_count"],
        })

    if user.role != UserRole.CUSTOMER:
        for i, row in enumerate(page["items"]):
            result[i]["customer_name"] = " ".join(
                p for p in [row["first_name"], row["last_name"]] if p
            ).strip() or row["email"]
            result[i]["customer_email"] = row["email"]

    return {
        "items": result,
        "has_more": page["has_more"],
        "total_count": page["total_count"],
        "unread_total": page["unread_total"],
    }


@router.get("/{conversation_id}")
def get_conversation(conversation_id: int, request: Request):
    user = _require_user(request)

    conv = conv_sql.get_conversation(conversation_id)
    if conv is None or conv.archived_at is not None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user.role == UserRole.CUSTOMER and conv.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return {
        "id": conv.id,
        "customer_id": conv.customer_id,
        "repair_request_id": conv.repair_request_id,
        "repair_status": conv_sql.get_conversation_repair_status(conversation_id),
        "created_at": conv.created_at,
        "last_message_at": conv.last_message_at,
    }


@router.post("/{conversation_id}/read")
def mark_read(conversation_id: int, request: Request):
    user = _require_user(request)

    conv = conv_sql.get_conversation(conversation_id)
    if conv is None or conv.archived_at is not None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user.role == UserRole.CUSTOMER and conv.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID required")

    conv_sql.mark_conversation_read(conversation_id, user.id)
    return {"ok": True}


@router.get("/{conversation_id}/messages")
def get_messages(
    conversation_id: int,
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    before_id: int | None = Query(None),
):
    user = _require_user(request)

    conv = conv_sql.get_conversation(conversation_id)
    if conv is None or conv.archived_at is not None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user.role == UserRole.CUSTOMER and conv.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    rows = conv_sql.list_messages(
        conversation_id=conversation_id,
        limit=limit,
        before_id=before_id,
    )

    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "conversation_id": row["conversation_id"],
            "sender_id": row["sender_id"],
            "sender_name": " ".join(
                p for p in [row["first_name"], row["last_name"]] if p
            ).strip() or None,
            "sender_role": row["role"],
            "content": row["content"],
            "created_at": row["created_at"],
        })

    return result



@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    body: SendMessageRequest,
    request: Request,
):
    user = _require_user(request)

    conv = conv_sql.get_conversation(conversation_id)
    if conv is None or conv.archived_at is not None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user.role == UserRole.CUSTOMER and conv.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    content = body.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID is missing")
    message = conv_sql.insert_message(
        conversation_id=conversation_id,
        sender_id=user.id,
        content=content,
    )


    conv_sql.touch_conversation(conversation_id)

    if message.id is None:
        raise HTTPException(status_code=500, detail="Failed to send message")

    await broadcaster.publish_message(
        conversation_id=conversation_id,
        message_id=message.id,
        sender_id=user.id,
    )

    return {
        "id": message.id,
        "conversation_id": conversation_id,
        "sender_id": user.id,
        "content": message.content,
        "created_at": message.created_at,
    }
