from datetime import date

from fastapi import APIRouter, HTTPException, Query, Request

from src.models.users import UserRole
from src.services.auth import get_current_user_id
from src.sql import repair_request as rr_sql
from src.sql.auth import get_user_by_id

router = APIRouter()


def _require_user(request: Request):
    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = get_user_by_id(user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=403, detail="Account is unavailable")

    return user
@router.get("/")
def list_appointments(
    request: Request,
    on_date: date = Query(...),
):
    user = _require_user(request)

    if user.role == UserRole.CUSTOMER:
        rows = rr_sql.list_appointments_for_customer(user.id, on_date) # type: ignore
    else:
        rows = rr_sql.list_appointments_for_team(on_date)

    result = []
    for row in rows:
        item = {
            "id": row["id"],
            "scheduled_date": row["scheduled_date"],
            "scheduled_time": row["scheduled_time"],
            "status": row["status"],
            "repair_request_id": row["repair_request_id"],
            "repair_number": row["repair_number"],
            "requested_service": row["requested_service"],
            "computer_name": row["computer_name"],
            "computer_type": row["computer_type"],
        }

        if user.role != UserRole.CUSTOMER:
            name = " ".join(
                p for p in [row["first_name"], row["last_name"]] if p
            ).strip()
            item["customer_id"] = row["customer_id"]
            item["customer_name"] = name or row["email"]

        result.append(item)

    return result


@router.get("/week")
def appointments_week(
    request: Request,
    start: date = Query(...),
    end: date = Query(...),
):
    """Counts per day for the week strip. { "2026-10-14": 3, ... }"""
    user = _require_user(request)

    customer_id = user.id if user.role == UserRole.CUSTOMER else None
    return rr_sql.count_appointments_by_day(customer_id, start, end)

@router.get("/next")
def next_appointment(request: Request):
    user = _require_user(request)
    customer_id = user.id if user.role == UserRole.CUSTOMER else None
    return {"date": rr_sql.next_appointment_date(customer_id)}
