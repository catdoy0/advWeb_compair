import secrets
from datetime import date, datetime, time, timezone

from sqlalchemy import text
from sqlmodel import Session, select

from src.database import engine
from src.models.appointments import Appointments
from src.models.conversations import Conversations
from src.models.devices import Devices
from src.models.enums import AppointmentStatus, ComputerType, RepairRequestStatus
from src.models.repair_requests import Repair_Requests
from src.models.repairs import Repairs
from src.sql import conversation as conv_sql

WORKFLOW_ORDER = [
    "PENDING",
    "RECEIVED",
    "DIAGNOSING",
    "REPAIRING",
    "COMPLETED",
    "RELEASED",
]

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_repair_number() -> str:
    # CP-XXXXXX (6 hex chars, ~16M combos)
    return f"CP-{secrets.token_hex(3).upper()}"


def _person_name(
    first_name: str | None,
    last_name: str | None,
    fallback: str | None = None,
) -> str | None:
    name = " ".join(part for part in (first_name, last_name) if part).strip()
    return name or fallback



def find_device(customer_id: int, computer_name: str) -> Devices | None:
    with Session(engine) as s:
        return s.exec(
            select(Devices)
            .where(Devices.customer_id == customer_id)
            .where(Devices.computer_name == computer_name)
        ).first()


def create_device(
    customer_id: int,
    computer_name: str,
    computer_type: ComputerType,
    serial_number: str | None,
) -> Devices:
    with Session(engine) as s:
        device = Devices(
            customer_id=customer_id,
            computer_name=computer_name,
            computer_type=computer_type,
            serial_number=serial_number,
        )
        s.add(device)
        s.commit()
        s.refresh(device)
        return device


def create_repair_request(
    customer_id: int,
    device_id: int,
    contact_detail: str | None,
    requested_service: str,
    reported_problem: str,
    preferred_date: date,
    preferred_time: time,
) -> Repair_Requests:
    with Session(engine) as s:
        req = Repair_Requests(
            repair_number=_generate_repair_number(),
            customer_id=customer_id,
            device_id=device_id,
            contact_detail=contact_detail,
            requested_service=requested_service,
            reported_problem=reported_problem,
            preferred_date=preferred_date,
            preferred_time=preferred_time,
            status=RepairRequestStatus.PENDING,
        )
        s.add(req)
        s.commit()
        s.refresh(req)
        return req


def create_appointment(
    repair_request_id: int,
    scheduled_date: date,
    scheduled_time: time,
) -> Appointments:
    with Session(engine) as s:
        appt = Appointments(
            repair_request_id=repair_request_id,
            scheduled_date=scheduled_date,
            scheduled_time=scheduled_time,
            status=AppointmentStatus.PENDING,
        )
        s.add(appt)
        s.commit()
        s.refresh(appt)
        return appt


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



def list_appointments_for_customer(customer_id: int, on_date: date) -> list[dict]:
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT
                a.id,
                a.scheduled_date,
                a.scheduled_time,
                a.status,
                rr.id AS repair_request_id,
                rr.repair_number,
                rr.requested_service,
                d.computer_name,
                d.computer_type
            FROM appointments a
            JOIN repair_requests rr ON rr.id = a.repair_request_id
            JOIN devices d ON d.id = rr.device_id
            WHERE rr.customer_id = :cid
              AND a.scheduled_date = :day
            ORDER BY a.scheduled_time
        """), {"cid": customer_id, "day": on_date}).mappings().all()

    return [dict(r) for r in rows]


def list_appointments_for_team(on_date: date) -> list[dict]:
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT
                a.id,
                a.scheduled_date,
                a.scheduled_time,
                a.status,
                rr.id AS repair_request_id,
                rr.repair_number,
                rr.requested_service,
                d.computer_name,
                d.computer_type,
                u.id AS customer_id,
                u.first_name,
                u.last_name,
                u.email
            FROM appointments a
            JOIN repair_requests rr ON rr.id = a.repair_request_id
            JOIN devices d ON d.id = rr.device_id
            JOIN users u ON u.id = rr.customer_id
            WHERE a.scheduled_date = :day
            ORDER BY a.scheduled_time
        """), {"day": on_date}).mappings().all()

    return [dict(r) for r in rows]


def decline_stale_appointments() -> int:
    """
    Automatically cancels PENDING appointments where the scheduled_date 
    was 3 or more days ago. Returns the number of rows updated.
    """
    with Session(engine) as s:
        result = s.execute(
            text("""
                UPDATE appointments
                SET status = 'CANCELLED', updated_at = NOW()
                WHERE status = 'PENDING'
                  AND scheduled_date <= CURRENT_DATE - INTERVAL '3 days'
            """)
        )
        s.commit()

        return result.rowcount # type: ignore


def count_appointments_by_day(
    customer_id: int | None,
    start: date,
    end: date,
) -> dict[str, int]:
    with Session(engine) as s:
        if customer_id is not None:
            sql = text("""
                SELECT a.scheduled_date, COUNT(*) AS n
                FROM appointments a
                JOIN repair_requests rr ON rr.id = a.repair_request_id
                WHERE rr.customer_id = :cid
                  AND a.scheduled_date BETWEEN :start AND :end
                GROUP BY a.scheduled_date
            """)
            params = {"cid": customer_id, "start": start, "end": end}
        else:
            sql = text("""
                SELECT a.scheduled_date, COUNT(*) AS n
                FROM appointments a
                WHERE a.scheduled_date BETWEEN :start AND :end
                GROUP BY a.scheduled_date
            """)
            params = {"start": start, "end": end}

        rows = s.execute(sql, params).all()

    return {row[0].isoformat(): row[1] for row in rows}


def get_next_appointment(customer_id: int | None, offset: int = 0) -> dict:
    """Return one upcoming appointment and whether another page exists."""
    with Session(engine) as s:
        base_sql = """
            SELECT
                a.id,
                a.scheduled_date,
                a.scheduled_time,
                a.status,
                rr.id AS repair_request_id,
                rr.repair_number,
                rr.requested_service,
                d.computer_name,
                d.computer_type
            FROM appointments a
            JOIN repair_requests rr ON rr.id = a.repair_request_id
            JOIN devices d ON d.id = rr.device_id
            WHERE a.scheduled_date >= CURRENT_DATE
              AND a.status IN ('PENDING', 'CONFIRMED')
        """
        
        customer_filter = " AND rr.customer_id = :cid" if customer_id is not None else ""
        sql = text(
            base_sql
            + customer_filter
            + " ORDER BY a.scheduled_date ASC, a.scheduled_time ASC, a.id ASC LIMIT 2 OFFSET :offset"
        )
        params = {"offset": max(offset, 0)}
        if customer_id is not None:
            params["cid"] = customer_id

        rows = s.execute(sql, params).mappings().all()

    return {
        "appointment": dict(rows[0]) if rows else None,
        "has_next": len(rows) > 1,
    }


def count_appointments_for_day(on_date: date) -> int:
    with Session(engine) as s:
        return s.execute(
            text("""
                SELECT COUNT(*)
                FROM appointments
                WHERE scheduled_date = :day
                  AND status != 'CANCELLED'
            """),
            {"day": on_date},
        ).scalar_one()

def list_repair_queue(status: str | None, search: str) -> list[dict]:
    sql = """
        SELECT
            rr.id,
            rr.repair_number,
            rr.created_at,
            rr.status,
            rr.reported_problem,
            d.computer_name,
            u.id            AS customer_id,
            u.first_name,
            u.last_name,
            u.email,
            t.id            AS technician_id,
            t.first_name    AS technician_first,
            t.last_name     AS technician_last,
            r.estimate_amount
        FROM repair_requests rr
        JOIN users u ON u.id = rr.customer_id
        JOIN devices d ON d.id = rr.device_id
        LEFT JOIN repairs r ON r.repair_request_id = rr.id
        LEFT JOIN users t ON t.id = r.technician_id
        WHERE 1=1
    """

    params: dict = {}

    if status:
        sql += " AND rr.status = CAST(:status AS repairrequeststatus)"
        params["status"] = status

    term = search.strip()
    if term:
        sql += """
            AND (
                rr.repair_number ILIKE :search
                OR u.first_name ILIKE :search
                OR u.last_name ILIKE :search
                OR u.email ILIKE :search
                OR d.computer_name ILIKE :search
            )
        """
        params["search"] = f"%{term}%"

    sql += " ORDER BY rr.created_at DESC"

    with Session(engine) as s:
        rows = s.execute(text(sql), params).mappings().all()

    result = []
    for row in rows:
        customer_name = _person_name(
            row["first_name"], row["last_name"], row["email"]
        )

        technician_name = None
        if row["technician_id"] is not None:
            technician_name = _person_name(
                row["technician_first"], row["technician_last"]
            )

        result.append({
            "id": row["id"],
            "repair_number": row["repair_number"],
            "created_at": row["created_at"],
            "status": row["status"],
            "reported_problem": row["reported_problem"],
            "computer_name": row["computer_name"],
            "customer_id": row["customer_id"],
            "customer_name": customer_name,
            "technician_id": row["technician_id"],
            "technician_name": technician_name,
            "estimate_amount": (
                float(row["estimate_amount"])
                if row["estimate_amount"] is not None
                else None
            ),
        })

    return result


def count_repair_queue_by_status() -> dict[str, int]:
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT status, COUNT(*) AS n
            FROM repair_requests
            GROUP BY status
        """)).all()

    counts: dict[str, int] = {}
    total = 0
    for status_value, count in rows:
        # status_value is the enum's string form (e.g. "RECEIVED")
        counts[status_value] = count
        total += count

    counts["ALL"] = total
    return counts


def _serialize_repair_detail(row) -> dict:
    customer_name = _person_name(
        row["customer_first"], row["customer_last"], row["customer_email"]
    )

    technician_name = None
    if row["technician_id"] is not None:
        technician_name = _person_name(
            row["technician_first"], row["technician_last"]
        )

    return {
        "id": row["id"],
        "repair_number": row["repair_number"],
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "computer_name": row["computer_name"],
        "computer_type": row["computer_type"],
        "serial_number": row["serial_number"],
        "requested_service": row["requested_service"],
        "reported_problem": row["reported_problem"],
        "contact_detail": row["contact_detail"],
        "customer_id": row["customer_id"],
        "customer_name": customer_name,
        "customer_email": row["customer_email"],
        "technician_id": row["technician_id"],
        "technician_name": technician_name,
        "diagnosis": row["diagnosis"],
        "estimate_amount": (
            float(row["estimate_amount"]) if row["estimate_amount"] is not None else None
        ),
        "final_amount": (
            float(row["final_amount"]) if row["final_amount"] is not None else None
        ),
        "appointment_date": row["appointment_date"],
        "appointment_time": row["appointment_time"],
    }


def _get_repair_detail(column: str, value: int | str) -> dict | None:
    # The column is selected only by the internal ID/number wrappers below.
    with Session(engine) as s:
        row = s.execute(text(f"""
            SELECT
                rr.id,
                rr.repair_number,
                rr.status,
                rr.created_at,
                rr.updated_at,
                rr.requested_service,
                rr.reported_problem,
                rr.contact_detail,
                d.computer_name,
                d.computer_type,
                d.serial_number,
                u.id AS customer_id,
                u.first_name AS customer_first,
                u.last_name AS customer_last,
                u.email AS customer_email,
                t.id AS technician_id,
                t.first_name AS technician_first,
                t.last_name AS technician_last,
                r.diagnosis,
                r.estimate_amount,
                r.final_amount,
                a.scheduled_date AS appointment_date,
                a.scheduled_time AS appointment_time
            FROM repair_requests rr
            JOIN users u ON u.id = rr.customer_id
            JOIN devices d ON d.id = rr.device_id
            LEFT JOIN repairs r ON r.repair_request_id = rr.id
            LEFT JOIN users t ON t.id = r.technician_id
            LEFT JOIN appointments a ON a.repair_request_id = rr.id
            WHERE rr.{column} = :value
            ORDER BY a.scheduled_date ASC
            LIMIT 1
        """), {"value": value}).mappings().first()

    return _serialize_repair_detail(row) if row is not None else None


def get_repair_detail(repair_request_id: int) -> dict | None:
    return _get_repair_detail("id", repair_request_id)


def _ensure_repair_and_assign(
    s,
    repair_request_id: int,
    technician_id: int | None,
) -> None:
    """Create the repairs row if missing and assign a technician when none is set."""
    repair = s.exec(
        select(Repairs).where(Repairs.repair_request_id == repair_request_id)
    ).first()

    if repair is None:
        repair = Repairs(repair_request_id=repair_request_id)
        s.add(repair)
        s.flush()

    if technician_id is not None and repair.technician_id is None:
        repair.technician_id = technician_id




def advance_repair_status(
    repair_request_id: int,
    technician_id: int | None = None,
) -> tuple[str | None, int | None]:
    with Session(engine) as s:
        req = s.get(Repair_Requests, repair_request_id)
        if req is None:
            return None, None

        current = req.status.value
        if current not in WORKFLOW_ORDER:
            return None, None

        current_index = WORKFLOW_ORDER.index(current)
        if current_index >= len(WORKFLOW_ORDER) - 1:
            return None, None

        next_status_value = WORKFLOW_ORDER[current_index + 1]

        req.status = RepairRequestStatus(next_status_value)
        req.updated_at = _now()

        _ensure_repair_and_assign(s, repair_request_id, technician_id)

        # sync appointment status with the workflow
        if next_status_value == "RECEIVED":
            s.execute(
                text("""
                    UPDATE appointments
                    SET status = 'CONFIRMED', updated_at = :now
                    WHERE repair_request_id = :rid AND status = 'PENDING'
                """),
                {"now": _now(), "rid": repair_request_id},
            )
        elif next_status_value == "RELEASED":
            s.execute(
                text("""
                    UPDATE appointments
                    SET status = 'COMPLETED', updated_at = :now
                    WHERE repair_request_id = :rid AND status != 'COMPLETED'
                """),
                {"now": _now(), "rid": repair_request_id},
            )

        s.commit()
        return next_status_value, req.customer_id


TERMINAL_STATUSES = {"RELEASED", "REJECTED", "CANCELLED"}


def reject_repair(
    repair_request_id: int,
    technician_id: int | None = None,
) -> tuple[str | None, int | None]:
    with Session(engine) as s:
        req = s.get(Repair_Requests, repair_request_id)
        if req is None:
            return None, None

        if req.status.value in TERMINAL_STATUSES:
            return None, None

        req.status = RepairRequestStatus.REJECTED
        req.updated_at = _now()

        _ensure_repair_and_assign(s, repair_request_id, technician_id)

        # cancel any pending or confirmed appointment
        s.execute(
            text("""
                UPDATE appointments
                SET status = 'CANCELLED', updated_at = :now
                WHERE repair_request_id = :rid
                  AND status IN ('PENDING', 'CONFIRMED')
            """),
            {"now": _now(), "rid": repair_request_id},
        )

        s.commit()
        return "REJECTED", req.customer_id


def set_estimate_amount(repair_request_id: int, amount: float) -> bool:
    """Manually set the estimate on the repairs row (creating it if needed)."""
    with Session(engine) as s:
        repair = s.exec(
            select(Repairs).where(Repairs.repair_request_id == repair_request_id)
        ).first()

        if repair is None:
            repair = Repairs(repair_request_id=repair_request_id)
            s.add(repair)

        repair.estimate_amount = amount
        s.commit()
        return True


def list_devices_for_customer(customer_id: int) -> list[dict]:
    """Every device owned by the customer, with its latest repair request if any."""
    with Session(engine) as s:
        rows = s.execute(
            text("""
                SELECT
                    d.id,
                    d.computer_name,
                    d.computer_type,
                    d.serial_number,
                    d.created_at,
                    rr.id            AS repair_request_id,
                    rr.repair_number,
                    rr.status        AS repair_status,
                    rr.created_at    AS repair_created_at,
                    r.estimate_amount
                FROM devices d
                LEFT JOIN LATERAL (
                    SELECT *
                    FROM repair_requests
                    WHERE device_id = d.id
                    ORDER BY created_at DESC
                    LIMIT 1
                ) rr ON TRUE
                LEFT JOIN repairs r ON r.repair_request_id = rr.id
                WHERE d.customer_id = :cid
                ORDER BY d.created_at DESC
            """),
            {"cid": customer_id},
        ).mappings().all()

    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "computer_name": row["computer_name"],
            "computer_type": row["computer_type"],
            "serial_number": row["serial_number"],
            "created_at": row["created_at"],
            "repair_request_id": row["repair_request_id"],
            "repair_number": row["repair_number"],
            "repair_status": row["repair_status"],
            "estimate_amount": (
                float(row["estimate_amount"])
                if row["estimate_amount"] is not None
                else None
            ),
        })

    return result


def list_devices_for_team() -> list[dict]:
    """Every customer device, with its owner and latest repair request."""
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT
                d.id,
                d.customer_id,
                u.first_name,
                u.last_name,
                u.email,
                d.computer_name,
                d.computer_type,
                d.serial_number,
                d.created_at,
                rr.id AS repair_request_id,
                rr.repair_number,
                rr.status AS repair_status,
                r.estimate_amount
            FROM devices d
            JOIN users u ON u.id = d.customer_id
            LEFT JOIN LATERAL (
                SELECT *
                FROM repair_requests
                WHERE device_id = d.id
                ORDER BY created_at DESC, id DESC
                LIMIT 1
            ) rr ON TRUE
            LEFT JOIN repairs r ON r.repair_request_id = rr.id
            ORDER BY d.created_at DESC, d.id DESC
        """)).mappings().all()

    return [
        {
            "id": row["id"],
            "customer_id": row["customer_id"],
            "customer_name": _person_name(row["first_name"], row["last_name"], row["email"]),
            "customer_email": row["email"],
            "computer_name": row["computer_name"],
            "computer_type": row["computer_type"],
            "serial_number": row["serial_number"],
            "created_at": row["created_at"],
            "repair_request_id": row["repair_request_id"],
            "repair_number": row["repair_number"],
            "repair_status": row["repair_status"],
            "estimate_amount": (
                float(row["estimate_amount"])
                if row["estimate_amount"] is not None
                else None
            ),
        }
        for row in rows
    ]


def get_workspace_summary(technician_id: int) -> dict:
    with Session(engine) as s:
        assigned = s.execute(text("""
            SELECT COUNT(*)
            FROM repairs r
            JOIN repair_requests rr ON rr.id = r.repair_request_id
            WHERE r.technician_id = :tid
              AND rr.status IN ('RECEIVED', 'DIAGNOSING', 'REPAIRING', 'COMPLETED')
        """), {"tid": technician_id}).scalar_one()

        diagnosing = s.execute(text("""
            SELECT COUNT(*)
            FROM repairs r
            JOIN repair_requests rr ON rr.id = r.repair_request_id
            WHERE r.technician_id = :tid
              AND rr.status = 'DIAGNOSING'
        """), {"tid": technician_id}).scalar_one()

        parts_on_hand = s.execute(text("""
            SELECT COALESCE(SUM(quantity), 0) FROM parts WHERE is_active = true
        """)).scalar_one()

        completed_today = s.execute(text("""
            SELECT COUNT(*)
            FROM repairs r
            JOIN repair_requests rr ON rr.id = r.repair_request_id
            WHERE r.technician_id = :tid
              AND rr.status = 'COMPLETED'
              AND rr.updated_at >= CURRENT_DATE
        """), {"tid": technician_id}).scalar_one()

    return {
        "assigned_devices": assigned,
        "diagnosing": diagnosing,
        "parts_on_hand": parts_on_hand,
        "completed_today": completed_today,
    }


def list_assigned_repairs(technician_id: int) -> list[dict]:
    """Repairs assigned to this technician, active workflow only."""
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT
                rr.id,
                rr.repair_number,
                rr.status,
                rr.reported_problem,
                rr.created_at,
                d.computer_name,
                u.id            AS customer_id,
                u.first_name,
                u.last_name,
                u.email,
                a.scheduled_date AS due_date,
                a.scheduled_time AS due_time,
                (
                    SELECT COUNT(*)
                    FROM repair_parts rp
                    WHERE rp.repair_id = r.id
                ) AS parts_used_count
            FROM repair_requests rr
            JOIN repairs r ON r.repair_request_id = rr.id
            JOIN devices d ON d.id = rr.device_id
            JOIN users u ON u.id = rr.customer_id
            LEFT JOIN appointments a ON a.repair_request_id = rr.id
            WHERE r.technician_id = :tid
              AND rr.status IN ('RECEIVED', 'DIAGNOSING', 'REPAIRING', 'COMPLETED')
            ORDER BY a.scheduled_date ASC NULLS LAST,
                     a.scheduled_time ASC NULLS LAST,
                     rr.created_at ASC
        """), {"tid": technician_id}).mappings().all()

    result = []
    for row in rows:
        customer_name = _person_name(
            row["first_name"], row["last_name"], row["email"]
        )

        result.append({
            "id": row["id"],
            "repair_number": row["repair_number"],
            "status": row["status"],
            "reported_problem": row["reported_problem"],
            "created_at": row["created_at"],
            "computer_name": row["computer_name"],
            "customer_id": row["customer_id"],
            "customer_name": customer_name,
            "due_date": row["due_date"],
            "due_time": row["due_time"],
            "parts_used_count": row["parts_used_count"],
        })

    return result


def get_customer_overview(customer_id: int) -> dict:
    with Session(engine) as s:
        # active request — most recent non-terminal
        active = s.execute(text("""
            SELECT
                rr.repair_number,
                rr.status,
                rr.reported_problem,
                d.computer_name
            FROM repair_requests rr
            JOIN devices d ON d.id = rr.device_id
            WHERE rr.customer_id = :cid
              AND rr.status NOT IN ('RELEASED', 'REJECTED', 'CANCELLED')
            ORDER BY rr.created_at DESC
            LIMIT 1
        """), {"cid": customer_id}).mappings().first()

        # next upcoming appointment
        appt = s.execute(text("""
            SELECT
                a.scheduled_date,
                a.scheduled_time,
                a.status,
                d.computer_name
            FROM appointments a
            JOIN repair_requests rr ON rr.id = a.repair_request_id
            JOIN devices d ON d.id = rr.device_id
            WHERE rr.customer_id = :cid
              AND a.scheduled_date >= CURRENT_DATE
              AND a.status IN ('PENDING', 'CONFIRMED')
            ORDER BY a.scheduled_date ASC, a.scheduled_time ASC
            LIMIT 1
        """), {"cid": customer_id}).mappings().first()

        # computer count
        computer_count = s.execute(text("""
            SELECT COUNT(*) FROM devices WHERE customer_id = :cid
        """), {"cid": customer_id}).scalar_one()

        # last message in the customer's general conversation
        last_message = s.execute(text("""
            SELECT
                m.content,
                m.created_at,
                u.first_name,
                u.last_name,
                u.role
            FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            JOIN users u ON u.id = m.sender_id
            WHERE c.customer_id = :cid
              AND c.repair_request_id IS NULL
            ORDER BY m.created_at DESC
            LIMIT 1
        """), {"cid": customer_id}).mappings().first()

        # recent requests for the list
        recent = s.execute(text("""
            SELECT
                rr.id,
                rr.repair_number,
                rr.status,
                rr.created_at,
                rr.reported_problem,
                d.computer_name
            FROM repair_requests rr
            JOIN devices d ON d.id = rr.device_id
            WHERE rr.customer_id = :cid
            ORDER BY rr.created_at DESC
            LIMIT 5
        """), {"cid": customer_id}).mappings().all()

    # build active
    active_out = None
    if active is not None:
        active_out = {
            "repair_number": active["repair_number"],
            "status": active["status"],
            "computer_name": active["computer_name"],
            "reported_problem": active["reported_problem"],
        }

    # build appointment
    appt_out = None
    if appt is not None:
        appt_out = {
            "scheduled_date": appt["scheduled_date"],
            "scheduled_time": appt["scheduled_time"],
            "status": appt["status"],
            "computer_name": appt["computer_name"],
        }

    # build last message
    msg_out = None
    if last_message is not None:
        sender_name = _person_name(
            last_message["first_name"], last_message["last_name"], "Compair"
        )
        is_from_team = last_message["role"] != "CUSTOMER"

        msg_out = {
            "content": last_message["content"],
            "created_at": last_message["created_at"],
            "sender_name": "Compair Team" if is_from_team else sender_name,
            "is_from_team": is_from_team,
        }

    unread = conv_sql.get_unread_count_for_customer(customer_id)

    return {
        "active_request": active_out,
        "next_appointment": appt_out,
        "unread_messages": unread,
        "computer_count": computer_count,
        "last_message": msg_out,
        "recent_requests": [dict(r) for r in recent],
    }


def get_repair_detail_by_number(repair_number: str) -> dict | None:
    """Look up repair detail by its public repair number."""
    return _get_repair_detail("repair_number", repair_number)


def list_recent_repairs_for_pos(limit: int = 6) -> list[dict]:
    """Most recent active repairs — the quick-pick list on the POS screen."""
    with Session(engine) as s:
        rows = s.execute(
            text("""
                SELECT
                    rr.id,
                    rr.repair_number,
                    rr.status
                FROM repair_requests rr
                WHERE rr.status IN ('RECEIVED', 'DIAGNOSING', 'REPAIRING', 'COMPLETED')
                ORDER BY rr.updated_at DESC NULLS LAST, rr.created_at DESC
                LIMIT :lim
            """),
            {"lim": limit},
        ).mappings().all()

    return [dict(r) for r in rows]


def checkout_repair(repair_request_id: int) -> tuple[str | None, int | None]:
    """
    Release the repair and mark the appointment completed.
    Returns (new_status, customer_id) on success, (None, None) if invalid.
    """
    with Session(engine) as s:
        req = s.get(Repair_Requests, repair_request_id)
        if req is None:
            return None, None

        if req.status.value == "RELEASED":
            return None, None

        if req.status.value not in ("COMPLETED", "REPAIRING"):
            return None, None

        req.status = RepairRequestStatus.RELEASED
        req.updated_at = _now()
        s.commit()

        s.execute(
            text("""
                UPDATE appointments
                SET status = 'COMPLETED', updated_at = :now
                WHERE repair_request_id = :rid AND status != 'COMPLETED'
            """),
            {"now": _now(), "rid": repair_request_id},
        )
        s.commit()

        return "RELEASED", req.customer_id
