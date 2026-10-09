from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from src.database import engine
from src.models.conversations import Conversations
from src.models.messages import Messages
from src.models.repair_requests import Repair_Requests
from src.models.users import Users


def _now() -> datetime:
    return datetime.now(timezone.utc)



def get_general_conversation(customer_id: int) -> Conversations | None:
    """The one thread with repair_request_id = NULL."""
    with Session(engine) as s:
        return s.exec(
            select(Conversations)
            .where(Conversations.customer_id == customer_id)
            .where(Conversations.repair_request_id == None)
        ).first()


def _create_general_conversation(customer_id: int) -> Conversations:
    with Session(engine) as s:
        conv = Conversations(customer_id=customer_id)
        s.add(conv)
        s.commit()
        s.refresh(conv)
        return conv


def get_or_create_general_conversation(customer_id: int) -> Conversations:
    existing = get_general_conversation(customer_id)
    if existing is not None:
        return existing
    return _create_general_conversation(customer_id)


def get_conversation(conversation_id: int) -> Conversations | None:
    with Session(engine) as s:
        return s.get(Conversations, conversation_id)


def get_conversation_for_repair(repair_request_id: int) -> Conversations | None:
    with Session(engine) as s:
        return s.exec(
            select(Conversations)
            .where(Conversations.repair_request_id == repair_request_id)
        ).first()


def create_conversation_for_repair(
    customer_id: int,
    repair_request_id: int,
) -> Conversations:
    with Session(engine) as s:
        conv = Conversations(
            customer_id=customer_id,
            repair_request_id=repair_request_id,
        )
        s.add(conv)
        s.commit()
        s.refresh(conv)
        return conv


def touch_conversation(conversation_id: int) -> None:
    """Bump last_message_at to now. Called after every message insert."""
    with Session(engine) as s:
        s.execute(
            text("UPDATE conversations SET last_message_at = :now WHERE id = :id"),
            {"now": _now(), "id": conversation_id},
        )
        s.commit()



def list_conversations_for_team() -> list[dict]:
    """All threads, newest activity first. Includes customer + repair context + last message."""
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT
                c.id,
                c.customer_id,
                c.repair_request_id,
                c.last_message_at,
                u.first_name,
                u.last_name,
                u.email,
                rr.repair_number,
                d.brand,
                d.model,
                m.content AS last_message
            FROM conversations c
            JOIN users u ON u.id = c.customer_id
            LEFT JOIN repair_requests rr ON rr.id = c.repair_request_id
            LEFT JOIN devices d ON d.id = rr.device_id
            LEFT JOIN LATERAL (
                SELECT content
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC
                LIMIT 1
            ) m ON TRUE
            ORDER BY c.last_message_at DESC
        """)).mappings().all()
            # WHERE NOT EXISTS (
            #     SELECT 1 FROM users u2
            #     WHERE u2.id = c.customer_id
            #     AND u2.role <> 'CUSTOMER'
            # )

    result_list = []
    for row in rows:
        result_list.append({
            "id": row["id"],
            "customer_id": row["customer_id"],
            "repair_request_id": row["repair_request_id"],
            "last_message_at": row["last_message_at"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "email": row["email"],
            "repair_number": row["repair_number"],
            "brand": row["brand"],
            "model": row["model"],
            "last_message": row["last_message"],
        })

    return result_list


def list_conversations_for_customer(customer_id: int) -> list[dict]:
    """Customer's own threads (general + one per repair)."""
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT
                c.id,
                c.customer_id,
                c.repair_request_id,
                c.last_message_at,
                rr.repair_number,
                d.brand,
                d.model,
                m.content AS last_message
            FROM conversations c
            LEFT JOIN repair_requests rr ON rr.id = c.repair_request_id
            LEFT JOIN devices d          ON d.id = rr.device_id
            LEFT JOIN LATERAL (
                SELECT content
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC
                LIMIT 1
            ) m ON TRUE
            WHERE c.customer_id = :cid
            ORDER BY c.repair_request_id IS NULL DESC, c.last_message_at DESC
        """), {"cid": customer_id}).mappings().all()

    result_list = []
    for row in rows:
        result_list.append({
            "id": row["id"],
            "customer_id": row["customer_id"],
            "repair_request_id": row["repair_request_id"],
            "last_message_at": row["last_message_at"],
            "repair_number": row["repair_number"],
            "brand": row["brand"],
            "model": row["model"],
            "last_message": row["last_message"],
        })

    return result_list


def list_messages(
    conversation_id: int,
    limit: int = 30,
    before_id: int | None = None,
) -> list[dict]:
    """Newest-first pagination. Frontend flips them for display."""
    with Session(engine) as s:
        if before_id is not None:
            sql = text("""
                SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
                       u.first_name, u.last_name, u.role
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.conversation_id = :cid AND m.id < :before
                ORDER BY m.id DESC
                LIMIT :limit
            """)
            params = {"cid": conversation_id, "before": before_id, "limit": limit}
        else:
            sql = text("""
                SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at,
                       u.first_name, u.last_name, u.role
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.conversation_id = :cid
                ORDER BY m.id DESC
                LIMIT :limit
            """)
            params = {"cid": conversation_id, "limit": limit}

        rows = s.execute(sql, params).mappings().all()

    result_list = []
    for row in rows:
        result_list.append({
            "id": row["id"],
            "conversation_id": row["conversation_id"],
            "sender_id": row["sender_id"],
            "content": row["content"],
            "created_at": row["created_at"],
            "first_name": row["first_name"],
            "last_name": row["last_name"],
            "role": row["role"],
        })

    return result_list


def insert_message(
    conversation_id: int,
    sender_id: int,
    content: str,
) -> Messages:
    with Session(engine) as s:
        msg = Messages(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
        )
        s.add(msg)
        s.commit()
        s.refresh(msg)
        return msg
