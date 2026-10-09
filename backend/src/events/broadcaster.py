import asyncio
from dataclasses import dataclass

from src.models.users import UserRole


@dataclass(eq=False)
class Subscriber:
    queue: asyncio.Queue
    user_id: int
    role: UserRole
    # None = team, sees everything
    # set  = customer, sees only these conversation ids
    conversation_ids: set[int] | None


_subscribers: set[Subscriber] = set()


def subscribe(
    user_id: int,
    role: UserRole,
    conversation_ids: set[int] | None,
) -> Subscriber:
    sub = Subscriber(
        queue=asyncio.Queue(),
        user_id=user_id,
        role=role,
        conversation_ids=conversation_ids,
    )
    _subscribers.add(sub)
    return sub


def unsubscribe(sub: Subscriber) -> None:
    _subscribers.discard(sub)


async def publish_message(
    conversation_id: int,
    message_id: int,
    sender_id: int,
) -> None:
    payload = {
        "conversation_id": conversation_id,
        "message_id": message_id,
        "sender_id": sender_id,
    }

    for sub in list(_subscribers):
        if sub.conversation_ids is not None and conversation_id not in sub.conversation_ids:
            continue

        await sub.queue.put({"event": "new-message", "data": payload})
