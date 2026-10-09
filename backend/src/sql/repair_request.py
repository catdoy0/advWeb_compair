import secrets
from datetime import date, datetime, time, timezone

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from src.database import engine
from src.models.appointments import Appointments
from src.models.conversations import Conversations
from src.models.devices import Devices
from src.models.enums import AppointmentStatus, ComputerType, RepairRequestStatus
from src.models.repair_requests import Repair_Requests


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_repair_number() -> str:
    # CP-XXXXXX (6 hex chars, ~16M combos)
    return f"CP-{secrets.token_hex(3).upper()}"



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


# ---------- reads ----------

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


def next_appointment_date(customer_id: int | None) -> date | None:
    """Earliest scheduled_date >= today. Customer-scoped if customer_id given."""
    with Session(engine) as s:
        if customer_id is not None:
            sql = text("""
                SELECT MIN(a.scheduled_date) AS d
                FROM appointments a
                JOIN repair_requests rr ON rr.id = a.repair_request_id
                WHERE rr.customer_id = :cid
                  AND a.scheduled_date >= CURRENT_DATE
            """)
            params = {"cid": customer_id}
        else:
            sql = text("""
                SELECT MIN(a.scheduled_date) AS d
                FROM appointments a
                WHERE a.scheduled_date >= CURRENT_DATE
            """)
            params = {}

        row = s.execute(sql, params).first()

    return row[0] if row and row[0] else None


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
        customer_name = " ".join(
            p for p in [row["first_name"], row["last_name"]] if p
        ).strip() or row["email"]

        technician_name = None
        if row["technician_id"] is not None:
            technician_name = " ".join(
                p for p in [row["technician_first"], row["technician_last"]] if p
            ).strip() or None

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


def get_repair_detail(repair_request_id: int) -> dict | None:
    with Session(engine) as s:
        row = s.execute(text("""
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
                u.id            AS customer_id,
                u.first_name    AS customer_first,
                u.last_name     AS customer_last,
                u.email         AS customer_email,
                t.id            AS technician_id,
                t.first_name    AS technician_first,
                t.last_name     AS technician_last,
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
            WHERE rr.id = :id
            ORDER BY a.scheduled_date ASC
            LIMIT 1
        """), {"id": repair_request_id}).mappings().first()

    if row is None:
        return None

    customer_name = " ".join(
        p for p in [row["customer_first"], row["customer_last"]] if p
    ).strip() or row["customer_email"]

    technician_name = None
    if row["technician_id"] is not None:
        technician_name = " ".join(
            p for p in [row["technician_first"], row["technician_last"]] if p
        ).strip() or None

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
        "estimate_amount": float(row["estimate_amount"]) if row["estimate_amount"] is not None else None,
        "final_amount": float(row["final_amount"]) if row["final_amount"] is not None else None,
        "appointment_date": row["appointment_date"],
        "appointment_time": row["appointment_time"],
    }
