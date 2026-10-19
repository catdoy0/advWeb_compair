from datetime import datetime, timezone

from sqlalchemy import text
from sqlmodel import Session, select

from src.database import engine
from src.models.conversations import Conversations
from src.models.messages import Messages


def _now() -> datetime:
    return datetime.now(timezone.utc)



def get_general_conversation(customer_id: int) -> Conversations | None:
    """The one thread with repair_request_id = NULL."""
    with Session(engine) as s:
        return s.exec(
            select(Conversations)
            .where(Conversations.customer_id == customer_id)
            .where(Conversations.repair_request_id == None)
            .where(Conversations.archived_at.is_(None))
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



def list_conversations_for_team(user_id: int) -> list[dict]:
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
                rr.status AS repair_status,
                d.computer_name,
                m.content AS last_message,
                unread.count AS unread_count
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
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS count
                FROM messages unread_message
                LEFT JOIN conversation_reads cr
                    ON cr.conversation_id = c.id AND cr.user_id = :uid
                WHERE unread_message.conversation_id = c.id
                  AND unread_message.sender_id != :uid
                  AND (cr.last_read_message_id IS NULL
                       OR unread_message.id > cr.last_read_message_id)
            ) unread ON TRUE
            WHERE c.archived_at IS NULL
              AND u.archived_at IS NULL
            ORDER BY c.last_message_at DESC
        """), {"uid": user_id}).mappings().all()
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
            "computer_name": row["computer_name"],
            "last_message": row["last_message"],
            "unread_count": row["unread_count"],
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
                d.computer_name,
                m.content AS last_message,
                unread.count AS unread_count
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
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS count
                FROM messages unread_message
                LEFT JOIN conversation_reads cr
                    ON cr.conversation_id = c.id AND cr.user_id = :cid
                WHERE unread_message.conversation_id = c.id
                  AND unread_message.sender_id != :cid
                  AND (cr.last_read_message_id IS NULL
                       OR unread_message.id > cr.last_read_message_id)
            ) unread ON TRUE
            WHERE c.customer_id = :cid AND c.archived_at IS NULL
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
            "computer_name": row["computer_name"],
            "last_message": row["last_message"],
            "unread_count": row["unread_count"],
        })

    return result_list


def search_conversations_for_team(
    user_id: int,
    search: str,
    limit: int,
    offset: int,
) -> dict:
    """Return a page of team conversations, matching search in the database."""
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
                rr.status AS repair_status,
                d.computer_name,
                m.content AS last_message,
                unread.count AS unread_count,
                COUNT(*) OVER() AS total_count,
                SUM(unread.count) OVER() AS unread_total
            FROM conversations c
            JOIN users u ON u.id = c.customer_id
            LEFT JOIN repair_requests rr ON rr.id = c.repair_request_id
            LEFT JOIN devices d ON d.id = rr.device_id
            LEFT JOIN LATERAL (
                SELECT content
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC, id DESC
                LIMIT 1
            ) m ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS count
                FROM messages unread_message
                LEFT JOIN conversation_reads cr
                    ON cr.conversation_id = c.id AND cr.user_id = :uid
                WHERE unread_message.conversation_id = c.id
                  AND unread_message.sender_id != :uid
                  AND (cr.last_read_message_id IS NULL
                       OR unread_message.id > cr.last_read_message_id)
            ) unread ON TRUE
            WHERE c.archived_at IS NULL
              AND u.archived_at IS NULL
              AND (
                   :search = ''
                   OR concat_ws(' ', u.first_name, u.last_name) ILIKE :pattern
                   OR u.email ILIKE :pattern
                   OR COALESCE(rr.repair_number, '') ILIKE :pattern
                   OR COALESCE(d.computer_name, '') ILIKE :pattern
                   OR COALESCE(m.content, '') ILIKE :pattern
              )
            ORDER BY c.last_message_at DESC, c.id DESC
            LIMIT :fetch_limit OFFSET :offset
        """), {
            "uid": user_id,
            "search": search.strip(),
            "pattern": f"%{search.strip()}%",
            "fetch_limit": limit + 1,
            "offset": offset,
        }).mappings().all()

    return _conversation_page(rows, limit)


def search_conversations_for_customer(
    customer_id: int,
    search: str,
    limit: int,
    offset: int,
) -> dict:
    """Return a page of a customer's conversations, matching search in the database."""
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT
                c.id,
                c.customer_id,
                c.repair_request_id,
                c.last_message_at,
                rr.repair_number,
                rr.status AS repair_status,
                d.computer_name,
                m.content AS last_message,
                unread.count AS unread_count,
                COUNT(*) OVER() AS total_count,
                SUM(unread.count) OVER() AS unread_total
            FROM conversations c
            LEFT JOIN repair_requests rr ON rr.id = c.repair_request_id
            LEFT JOIN devices d ON d.id = rr.device_id
            LEFT JOIN LATERAL (
                SELECT content
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC, id DESC
                LIMIT 1
            ) m ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS count
                FROM messages unread_message
                LEFT JOIN conversation_reads cr
                    ON cr.conversation_id = c.id AND cr.user_id = :cid
                WHERE unread_message.conversation_id = c.id
                  AND unread_message.sender_id != :cid
                  AND (cr.last_read_message_id IS NULL
                       OR unread_message.id > cr.last_read_message_id)
            ) unread ON TRUE
            WHERE c.customer_id = :cid AND c.archived_at IS NULL
              AND (
                    :search = ''
                    OR CASE WHEN c.repair_request_id IS NULL
                            THEN 'Compair Team' ELSE COALESCE(rr.repair_number, '') END ILIKE :pattern
                    OR COALESCE(rr.repair_number, '') ILIKE :pattern
                    OR COALESCE(d.computer_name, '') ILIKE :pattern
                    OR COALESCE(m.content, '') ILIKE :pattern
              )
            ORDER BY c.repair_request_id IS NULL DESC, c.last_message_at DESC, c.id DESC
            LIMIT :fetch_limit OFFSET :offset
        """), {
            "cid": customer_id,
            "search": search.strip(),
            "pattern": f"%{search.strip()}%",
            "fetch_limit": limit + 1,
            "offset": offset,
        }).mappings().all()

    return _conversation_page(rows, limit)


def _conversation_page(rows, limit: int) -> dict:
    has_more = len(rows) > limit
    items = []
    for row in rows[:limit]:
        item = dict(row)
        item.pop("total_count", None)
        item.pop("unread_total", None)
        items.append(item)

    return {
        "items": items,
        "has_more": has_more,
        "total_count": rows[0]["total_count"] if rows else 0,
        "unread_total": rows[0]["unread_total"] if rows else 0,
    }


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


def get_unread_count_for_customer(customer_id: int) -> int:
    with Session(engine) as s:
        return s.execute(text("""
            SELECT COUNT(*)
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            LEFT JOIN conversation_reads cr
                ON cr.conversation_id = c.id
               AND cr.user_id = :cid
            WHERE c.customer_id = :cid AND c.archived_at IS NULL
              AND m.sender_id != :cid
              AND (cr.last_read_message_id IS NULL OR m.id > cr.last_read_message_id)
        """), {"cid": customer_id}).scalar_one()


def mark_conversation_read(conversation_id: int, user_id: int) -> None:
    with Session(engine) as s:
        latest = s.execute(text("""
            SELECT MAX(id) FROM messages WHERE conversation_id = :cid
        """), {"cid": conversation_id}).scalar_one()

        if latest is None:
            return

        s.execute(text("""
            INSERT INTO conversation_reads
                (conversation_id, user_id, last_read_message_id, updated_at)
            VALUES (:cid, :uid, :mid, :now)
            ON CONFLICT (conversation_id, user_id)
            DO UPDATE SET
                last_read_message_id = EXCLUDED.last_read_message_id,
                updated_at = EXCLUDED.updated_at
        """), {
            "cid": conversation_id,
            "uid": user_id,
            "mid": latest,
            "now": _now(),
        })
        s.commit()


def archive_conversation(conversation_id: int) -> bool:
    with Session(engine) as s:
        result = s.execute(text("""
            UPDATE conversations c
            SET archived_at = :now
            WHERE c.id = :id
              AND c.archived_at IS NULL
              AND c.repair_request_id IS NOT NULL
              AND EXISTS (
                  SELECT 1 FROM repair_requests rr
                  WHERE rr.id = c.repair_request_id
                    AND rr.status IN ('COMPLETED', 'RELEASED', 'REJECTED')
              )
        """), {"id": conversation_id, "now": _now()})
        s.commit()
        return result.rowcount > 0


def can_archive_conversation(conversation_id: int) -> bool | None:
    with Session(engine) as s:
        row = s.execute(text("""
            SELECT c.archived_at, c.repair_request_id, rr.status
            FROM conversations c
            LEFT JOIN repair_requests rr ON rr.id = c.repair_request_id
            WHERE c.id = :id
        """), {"id": conversation_id}).mappings().first()
    if row is None:
        return None
    return (
        row["archived_at"] is None
        and row["repair_request_id"] is not None
        and row["status"] in {"COMPLETED", "RELEASED", "REJECTED"}
    )


def restore_conversation(conversation_id: int) -> bool:
    with Session(engine) as s:
        result = s.execute(text("""
            UPDATE conversations
            SET archived_at = NULL
            WHERE id = :id AND archived_at IS NOT NULL
        """), {"id": conversation_id})
        s.commit()
        return result.rowcount > 0


def list_archived_conversations(search: str, limit: int, offset: int) -> dict:
    pattern = f"%{search.strip()}%"
    with Session(engine) as s:
        total = s.execute(text("""
            SELECT COUNT(*)
            FROM conversations c
            JOIN users u ON u.id = c.customer_id
            LEFT JOIN repair_requests rr ON rr.id = c.repair_request_id
            LEFT JOIN devices d ON d.id = rr.device_id
            WHERE c.archived_at IS NOT NULL
              AND c.repair_request_id IS NOT NULL
              AND rr.status IN ('COMPLETED', 'RELEASED', 'REJECTED')
              AND (:search = '' OR u.email ILIKE :pattern
                   OR concat_ws(' ', u.first_name, u.last_name) ILIKE :pattern
                   OR COALESCE(rr.repair_number, '') ILIKE :pattern
                   OR COALESCE(d.computer_name, '') ILIKE :pattern)
        """), {"search": search.strip(), "pattern": pattern}).scalar_one()
        rows = s.execute(text("""
            SELECT c.id, c.customer_id, c.repair_request_id, c.archived_at,
                   u.first_name, u.last_name, u.email,
                   rr.repair_number, rr.status AS repair_status, d.computer_name,
                   latest.content AS preview
            FROM conversations c
            JOIN users u ON u.id = c.customer_id
            LEFT JOIN repair_requests rr ON rr.id = c.repair_request_id
            LEFT JOIN devices d ON d.id = rr.device_id
            LEFT JOIN LATERAL (
                SELECT content FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC, id DESC LIMIT 1
            ) latest ON TRUE
            WHERE c.archived_at IS NOT NULL
              AND c.repair_request_id IS NOT NULL
              AND rr.status IN ('COMPLETED', 'RELEASED', 'REJECTED')
              AND (:search = '' OR u.email ILIKE :pattern
                   OR concat_ws(' ', u.first_name, u.last_name) ILIKE :pattern
                   OR COALESCE(rr.repair_number, '') ILIKE :pattern
                   OR COALESCE(d.computer_name, '') ILIKE :pattern)
            ORDER BY c.archived_at DESC, c.id DESC
            LIMIT :limit OFFSET :offset
        """), {
            "search": search.strip(), "pattern": pattern,
            "limit": limit, "offset": offset,
        }).mappings().all()
    return {"items": [dict(row) for row in rows], "total": total}
