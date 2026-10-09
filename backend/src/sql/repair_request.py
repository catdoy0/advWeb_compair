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


# ---------- writes ----------

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
