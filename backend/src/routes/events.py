import asyncio
import json

from fastapi import APIRouter, HTTPException, Request
from sse_starlette.sse import EventSourceResponse

from src.events import broadcaster
from src.models.users import UserRole
from src.services.auth import get_current_user_id
from src.sql import conversation as conv_sql
from src.sql.auth import get_user_by_id

router = APIRouter()

PING_INTERVAL_SECONDS = 45


@router.get("")
async def events(request: Request):
    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = get_user_by_id(user_id)
    if user is None or not user.is_active or user.id is None:
        raise HTTPException(status_code=403, detail="Account is unavailable")


    if user.role == UserRole.CUSTOMER:
        conversations = conv_sql.list_conversations_for_customer(user.id)
        allowed_ids = {row["id"] for row in conversations}
    else:
        allowed_ids = None

    sub = broadcaster.subscribe(
        user_id=user.id,
        role=user.role,
        conversation_ids=allowed_ids,
    )

    async def stream():
        try:
            # handshake so frontend knows the connection is live
            yield {
                "event": "connected",
                "data": json.dumps({
                    "user_id": user.id,
                    "role": user.role.value,
                }),
            }

            while True:
                if await request.is_disconnected():
                    break

                try:
                    event = await asyncio.wait_for(
                        sub.queue.get(),
                        timeout=PING_INTERVAL_SECONDS,
                    )
                    yield {
                        "event": event["event"],
                        "data": json.dumps(event["data"]),
                    }
                except asyncio.TimeoutError:
                    # keep-alive so proxies don't kill idle connections
                    yield {"event": "ping", "data": "{}"}
        finally:
            broadcaster.unsubscribe(sub)


    # return EventSourceResponse(stream())
    return EventSourceResponse(
        stream(),
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
