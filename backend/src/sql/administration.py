import secrets
import string
from datetime import date, datetime, timezone

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, func, select, text

from src.database import engine
from src.models.enums import UserRole
from src.models.users import Users
from src.schemas.administration import GetUsers
from src.security.passwords import hash_password


def get_admin_overview(on_date: date, user_id: int) -> dict:
    """Read the operational data shown on the admin dashboard."""
    with Session(engine) as s:
        status_rows = s.execute(text("""
            SELECT status, COUNT(*) AS count
            FROM repair_requests
            GROUP BY status
        """)).mappings().all()
        repair_counts = {str(row["status"]): row["count"] for row in status_rows}

        estimate_total = s.execute(text("""
            SELECT COALESCE(SUM(r.estimate_amount), 0)
            FROM repair_requests rr
            LEFT JOIN repairs r ON r.repair_request_id = rr.id
            WHERE rr.status IN ('PENDING', 'RECEIVED', 'DIAGNOSING', 'REPAIRING')
        """)).scalar_one()

        schedule_rows = s.execute(text("""
            SELECT a.id, a.scheduled_time, a.status,
                   rr.id AS repair_request_id, rr.repair_number,
                   rr.requested_service, d.computer_name,
                   u.first_name, u.last_name, u.email
            FROM appointments a
            JOIN repair_requests rr ON rr.id = a.repair_request_id
            JOIN devices d ON d.id = rr.device_id
            JOIN users u ON u.id = rr.customer_id
            WHERE a.scheduled_date = :on_date
              AND a.status != 'CANCELLED'
            ORDER BY a.scheduled_time, a.id
        """), {"on_date": on_date}).mappings().all()

        in_motion_rows = s.execute(text("""
            SELECT rr.id, rr.repair_number, rr.status, rr.requested_service,
                   d.computer_name, u.first_name, u.last_name, u.email
            FROM repair_requests rr
            JOIN devices d ON d.id = rr.device_id
            JOIN users u ON u.id = rr.customer_id
            WHERE rr.status IN ('RECEIVED', 'DIAGNOSING', 'REPAIRING')
            ORDER BY COALESCE(rr.updated_at, rr.created_at) DESC, rr.id DESC
            LIMIT 4
        """)).mappings().all()

        attention_rows = s.execute(text("""
            SELECT rr.id, rr.repair_number, rr.status, rr.reported_problem,
                   rr.requested_service, rr.preferred_date, rr.preferred_time,
                   d.computer_name, u.first_name, u.last_name, u.email,
                   r.technician_id, t.first_name AS technician_first,
                   t.last_name AS technician_last
            FROM repair_requests rr
            JOIN devices d ON d.id = rr.device_id
            JOIN users u ON u.id = rr.customer_id
            LEFT JOIN repairs r ON r.repair_request_id = rr.id
            LEFT JOIN users t ON t.id = r.technician_id
            WHERE rr.status IN ('PENDING', 'COMPLETED')
               OR (rr.status IN ('RECEIVED', 'DIAGNOSING', 'REPAIRING')
                   AND r.technician_id IS NULL)
            ORDER BY CASE WHEN rr.status = 'COMPLETED' THEN 0 ELSE 1 END,
                     COALESCE(rr.updated_at, rr.created_at) ASC, rr.id ASC
            LIMIT 6
        """)).mappings().all()

        recent_rows = s.execute(text("""
            SELECT rr.id, rr.repair_number, rr.status,
                   COALESCE(rr.updated_at, rr.created_at) AS activity_at,
                   u.first_name, u.last_name, u.email, d.computer_name
            FROM repair_requests rr
            JOIN users u ON u.id = rr.customer_id
            JOIN devices d ON d.id = rr.device_id
            ORDER BY COALESCE(rr.updated_at, rr.created_at) DESC, rr.id DESC
            LIMIT 4
        """)).mappings().all()

        message_rows = s.execute(text("""
            SELECT c.id, c.last_message_at,
                   u.first_name, u.last_name, u.email,
                   rr.repair_number,
                   latest.content AS preview,
                   unread.count AS unread_count
            FROM conversations c
            JOIN users u ON u.id = c.customer_id
            LEFT JOIN repair_requests rr ON rr.id = c.repair_request_id
            JOIN LATERAL (
                SELECT content
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC, id DESC
                LIMIT 1
            ) latest ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS count
                FROM messages m
                LEFT JOIN conversation_reads cr
                  ON cr.conversation_id = c.id AND cr.user_id = :user_id
                WHERE m.conversation_id = c.id
                  AND m.sender_id != :user_id
                  AND (cr.last_read_message_id IS NULL
                       OR m.id > cr.last_read_message_id)
            ) unread ON TRUE
            WHERE c.archived_at IS NULL AND u.archived_at IS NULL
            ORDER BY c.last_message_at DESC, c.id DESC
            LIMIT 3
        """), {"user_id": user_id}).mappings().all()

        unread_total = s.execute(text("""
            SELECT COUNT(*)
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            JOIN users u ON u.id = c.customer_id
            LEFT JOIN conversation_reads cr
              ON cr.conversation_id = c.id AND cr.user_id = :user_id
            WHERE c.archived_at IS NULL AND u.archived_at IS NULL
              AND m.sender_id != :user_id
              AND (cr.last_read_message_id IS NULL
                   OR m.id > cr.last_read_message_id)
        """), {"user_id": user_id}).scalar_one()

    def person_name(row, first="first_name", last="last_name"):
        return " ".join(part for part in (row[first], row[last]) if part).strip() or row["email"]

    return {
        "date": on_date.isoformat(),
        "repair_counts": repair_counts,
        "estimated_service_value": float(estimate_total or 0),
        "schedule": [
            {
                "id": row["id"],
                "time": row["scheduled_time"].isoformat(),
                "status": str(row["status"]),
                "repair_request_id": row["repair_request_id"],
                "repair_number": row["repair_number"],
                "requested_service": row["requested_service"],
                "computer_name": row["computer_name"],
                "customer_name": person_name(row),
            }
            for row in schedule_rows
        ],
        "in_motion": [
            {
                "id": row["id"],
                "repair_number": row["repair_number"],
                "status": str(row["status"]),
                "requested_service": row["requested_service"],
                "computer_name": row["computer_name"],
                "customer_name": person_name(row),
            }
            for row in in_motion_rows
        ],
        "needs_attention": [
            {
                "id": row["id"],
                "repair_number": row["repair_number"],
                "status": str(row["status"]),
                "reported_problem": row["reported_problem"],
                "requested_service": row["requested_service"],
                "preferred_date": row["preferred_date"].isoformat(),
                "preferred_time": row["preferred_time"].isoformat(),
                "computer_name": row["computer_name"],
                "customer_name": person_name(row),
                "technician_name": (
                    " ".join(part for part in (row["technician_first"], row["technician_last"]) if part).strip()
                    if row["technician_id"] is not None else None
                ),
            }
            for row in attention_rows
        ],
        "recent_repairs": [
            {
                "id": row["id"],
                "repair_number": row["repair_number"],
                "status": str(row["status"]),
                "activity_at": row["activity_at"],
                "customer_name": person_name(row),
                "computer_name": row["computer_name"],
            }
            for row in recent_rows
        ],
        "messages": [
            {
                "conversation_id": row["id"],
                "customer_name": person_name(row),
                "repair_number": row["repair_number"],
                "preview": row["preview"],
                "last_message_at": row["last_message_at"],
                "unread_count": row["unread_count"],
            }
            for row in message_rows
        ],
        "unread_messages": unread_total,
    }


def get_customers(page: int, page_size: int, search: str) -> dict:
    """Return customer accounts with their existing device and repair totals."""
    offset = (page - 1) * page_size
    pattern = f"%{search.strip()}%"

    with Session(engine) as s:
        summary = s.execute(text("""
            SELECT
                COUNT(*) AS total_customers,
                COUNT(*) FILTER (WHERE u.is_active) AS active_customers,
                COUNT(*) FILTER (
                    WHERE EXISTS (
                        SELECT 1
                        FROM repair_requests rr
                        WHERE rr.customer_id = u.id
                        GROUP BY rr.customer_id
                        HAVING COUNT(*) > 1
                    )
                ) AS returning_customers,
                (SELECT COUNT(*) FROM devices d
                 JOIN users customer ON customer.id = d.customer_id
                 WHERE customer.role = 'CUSTOMER'
                   AND customer.archived_at IS NULL) AS devices_on_record
            FROM users u
            WHERE u.role = 'CUSTOMER' AND u.archived_at IS NULL
        """)).mappings().one()

        total = s.execute(text("""
            SELECT COUNT(*)
            FROM users u
            WHERE u.role = 'CUSTOMER'
              AND u.archived_at IS NULL
              AND (
                  :search = ''
                  OR u.first_name ILIKE :pattern
                  OR u.last_name ILIKE :pattern
                  OR concat_ws(' ', u.first_name, u.last_name) ILIKE :pattern
                  OR u.email ILIKE :pattern
              )
        """), {"search": search.strip(), "pattern": pattern}).scalar_one()

        rows = s.execute(text("""
            SELECT
                u.id, u.first_name, u.last_name, u.email, u.is_active,
                u.created_at, u.last_sign_in,
                COUNT(DISTINCT d.id) AS device_count,
                COUNT(DISTINCT rr.id) AS repair_count
            FROM users u
            LEFT JOIN devices d ON d.customer_id = u.id
            LEFT JOIN repair_requests rr ON rr.customer_id = u.id
            WHERE u.role = 'CUSTOMER'
              AND u.archived_at IS NULL
              AND (
                  :search = ''
                  OR u.first_name ILIKE :pattern
                  OR u.last_name ILIKE :pattern
                  OR concat_ws(' ', u.first_name, u.last_name) ILIKE :pattern
                  OR u.email ILIKE :pattern
              )
            GROUP BY u.id
            ORDER BY u.created_at DESC, u.id DESC
            LIMIT :limit OFFSET :offset
        """), {
            "search": search.strip(),
            "pattern": pattern,
            "limit": page_size,
            "offset": offset,
        }).mappings().all()

    return {
        "items": [dict(row) for row in rows],
        "total": total,
        "summary": {key: summary[key] for key in (
            "total_customers", "active_customers", "returning_customers", "devices_on_record"
        )},
    }


def get_users(how_many: int = 10, page: int = 1, search: str = "", role: str = "") -> list[GetUsers]:
    """
    raw dog sql
    """
    how_many = max(0, min(how_many, 30))

    page = max(1, page)
    
    db_offset = (page - 1) * how_many
    role = role.strip()
    search = search.strip()

    try:
        with Session(engine) as s:
            if role == "ADMIN":
                sql = text("""
                    SELECT * FROM users
                    WHERE (first_name ILIKE :search OR last_name ILIKE :search OR email ILIKE :search)
                    AND archived_at IS NULL
                    AND role IN ('ADMIN', 'SUPER_ADMIN')
                    ORDER BY id
                    LIMIT :limit OFFSET :offset
                """)
                params = {
                    "search": f"%{search}%",
                    "limit": how_many,
                    "offset": db_offset,
                }
            elif role:
                sql = text("""
                    SELECT * FROM users
                    WHERE (first_name ILIKE :search OR last_name ILIKE :search OR email ILIKE :search)
                    AND archived_at IS NULL
                    AND role = CAST(:role AS userrole)
                    ORDER BY id
                    LIMIT :limit OFFSET :offset
                """)
                params = {
                    "search": f"%{search}%",
                    "role": role,
                    "limit": how_many,
                    "offset": db_offset,
                }
            else:
                sql = text("""
                    SELECT * FROM users
                    WHERE (first_name ILIKE :search OR last_name ILIKE :search OR email ILIKE :search)
                    AND archived_at IS NULL
                    ORDER BY id
                    LIMIT :limit OFFSET :offset
                """)
                params = {
                    "search": f"%{search}%",
                    "limit": how_many,
                    "offset": db_offset,
                }

            rows = s.execute(sql, params).mappings().all()
            # result_list = []
            # for row in rows:
            #     result_list.append({
            #         "id": row["id"],
            #         "first_name": row["first_name"],
            #         "last_name": row["last_name"],
            #         "email": row["email"],
            #         "role": row["role"],
            #         "is_active": row["is_active"]
            #     })
        return [GetUsers(**row) for row in rows]

    except SQLAlchemyError as e:
        print(f"fucked up get_users() {e}")
        return []


def get_total_users():
    with Session(engine) as s:
        rows = s.exec(
            select(Users.role, func.count())
            .where(Users.archived_at.is_(None))
            .group_by(Users.role)
        ).all()

    counts = {role.value: count for role, count in rows}

    return {
        "total_accounts": sum(counts.values()),
        "customer_total": counts.get("CUSTOMER", 0),
        "technician_total": counts.get("TECHNICIAN", 0),
        "staff_total": counts.get("STAFF", 0),
        "administrator_total": counts.get("ADMIN", 0) + counts.get("SUPER_ADMIN", 0),
    }


def set_user_active(user_id: int, is_active: bool) -> bool:
    try:
        with Session(engine) as s:
            user = s.get(Users, user_id)
            if not user:
                return False
            user.is_active = is_active
            s.commit()
        return True
    except SQLAlchemyError as e:
        print(f"set_user_active failed: {e}")
        return False

def edit_user(user: GetUsers) -> bool:
    try:
        with Session(engine) as s:
            db_user = s.get(Users, user.id)
            if not db_user:
                return False

            db_user.first_name = user.first_name
            db_user.last_name = user.last_name
            db_user.email = user.email
            db_user.role = UserRole(user.role)
            db_user.updated_at = datetime.now(timezone.utc)

            s.commit()
        return True
    except SQLAlchemyError as e:
        print(f"edit_user failed: {e}")
        return False

def get_user_role(user_id: int) -> str | None:
    with Session(engine) as s:
        user = s.get(Users, user_id)
        if not user:
            return None
        return user.role.value


def count_active_super_admins() -> int:
    with Session(engine) as s:
        return s.exec(
            select(func.count())
            .select_from(Users)
            .where(Users.role == UserRole.SUPER_ADMIN)
            .where(Users.is_active == True)
            .where(Users.archived_at.is_(None))
        ).one()


def get_user_state(user_id: int) -> tuple[str, bool] | None:
    with Session(engine) as s:
        user = s.get(Users, user_id)
        if not user:
            return None
        return user.role.value, user.is_active


def archive_user(user_id: int) -> bool:
    with Session(engine) as s:
        user = s.get(Users, user_id)
        if user is None or user.archived_at is not None:
            return False
        user.archived_at = datetime.now(timezone.utc)
        s.commit()
        return True


def restore_user(user_id: int) -> bool:
    with Session(engine) as s:
        user = s.get(Users, user_id)
        if user is None or user.archived_at is None:
            return False
        user.archived_at = None
        s.commit()
        return True


def list_archived_users(search: str, limit: int, offset: int) -> dict:
    pattern = f"%{search.strip()}%"
    with Session(engine) as s:
        total = s.execute(text("""
            SELECT COUNT(*) FROM users u
            WHERE u.archived_at IS NOT NULL
              AND (:search = '' OR u.first_name ILIKE :pattern
                   OR u.last_name ILIKE :pattern
                   OR concat_ws(' ', u.first_name, u.last_name) ILIKE :pattern
                   OR u.email ILIKE :pattern)
        """), {"search": search.strip(), "pattern": pattern}).scalar_one()
        rows = s.execute(text("""
            SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                   u.is_active, u.created_at, u.last_sign_in, u.archived_at
            FROM users u
            WHERE u.archived_at IS NOT NULL
              AND (:search = '' OR u.first_name ILIKE :pattern
                   OR u.last_name ILIKE :pattern
                   OR concat_ws(' ', u.first_name, u.last_name) ILIKE :pattern
                   OR u.email ILIKE :pattern)
            ORDER BY u.archived_at DESC, u.id DESC
            LIMIT :limit OFFSET :offset
        """), {
            "search": search.strip(), "pattern": pattern,
            "limit": limit, "offset": offset,
        }).mappings().all()
    return {"items": [dict(row) for row in rows], "total": total}




# def reset_user_password(user_id: int) -> str:
#     try:
#         with Session(engine) as s:
#             user = s.get(Users, user_id)
#             if not user:
#                 return ""
#
#             alphabet = string.ascii_letters + string.digits
#             raw_password = "".join(secrets.choice(alphabet) for _ in range(8))
#
#             user.password_hash = hash_password(raw_password)
#             user.updated_at = datetime.now(timezone.utc)
#             s.commit()
#
#             return raw_password
#     except SQLAlchemyError as e:
#         print(f"reset_user_password failed: {e}")
#         return ""
def reset_user_password(user_id: int) -> str:
    try:
        alphabet = string.ascii_letters + string.digits
        raw_password = "".join(secrets.choice(alphabet) for _ in range(8))
        hashed = hash_password(raw_password)

        with Session(engine) as s:
            result = s.execute(
                text("""
                    UPDATE users
                    SET password_hash = :password_hash,
                        updated_at = :updated_at
                    WHERE id = :user_id
                """),
                {
                    "password_hash": hashed,
                    "updated_at": datetime.now(timezone.utc),
                    "user_id": user_id,
                },
            )
            s.commit()

            if result.rowcount == 0: # type: ignore
                return ""

        return raw_password
    except SQLAlchemyError as e:
        print(f"reset_user_password failed: {e}")
        return ""
