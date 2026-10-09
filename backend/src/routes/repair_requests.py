from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Request

from src.schemas.repair_request import (
    CreateRepairRequestRequest,
    RepairRequestCreated,
)
from src.services.auth import get_current_user_id
from src.sql import repair_request as rr_sql
from src.sql.auth import get_user_by_id

router = APIRouter()

DAY_CAPACITY = 6


def _require_user(request: Request):
    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = get_user_by_id(user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=403, detail="Account is unavailable")

    return user

def _validate_preferred_datetime(body: CreateRepairRequestRequest):
    now = datetime.now()
    preferred_dt = datetime.combine(body.preferred_date, body.preferred_time)

    if preferred_dt < now:
        raise HTTPException(status_code=400, detail="Preferred date and time must be in the future")

    if (body.preferred_date - date.today()).days > 31:
        raise HTTPException(status_code=400, detail="Preferred date must be within 31 days")

    if not (8 <= body.preferred_time.hour < 19):
        raise HTTPException(status_code=400, detail="Preferred time must be between 8:00 and 19:00")


@router.post("/", response_model=RepairRequestCreated)
def create_repair_request(
    body: CreateRepairRequestRequest,
    request: Request,
):
    user = _require_user(request)
    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    _validate_preferred_datetime(body)

    count = rr_sql.count_appointments_for_day(body.preferred_date)
    if count >= DAY_CAPACITY:
        raise HTTPException(
            status_code=409,
            detail="That day is fully booked. Please choose another date.",
        )

    # find-or-create the device for this customer
    device = rr_sql.find_device(user.id, body.computer_name)
    if device is None:
        device = rr_sql.create_device(
            customer_id=user.id,
            computer_name=body.computer_name,
            computer_type=body.computer_type,
            serial_number=body.serial_number,
        )

    if device.id is None:
        raise HTTPException(status_code=500, detail="Failed to create device")

    req = rr_sql.create_repair_request(
        customer_id=user.id,
        device_id=device.id,
        contact_detail=body.contact_detail,
        requested_service=body.requested_service,
        reported_problem=body.reported_problem,
        preferred_date=body.preferred_date,
        preferred_time=body.preferred_time,
    )

    if req.id is None:
        raise HTTPException(status_code=500, detail="Failed to create repair request")

    appt = rr_sql.create_appointment(
        repair_request_id=req.id,
        scheduled_date=body.preferred_date,
        scheduled_time=body.preferred_time,
    )

    conv = rr_sql.create_conversation_for_repair(
        customer_id=user.id,
        repair_request_id=req.id,
    )

    return RepairRequestCreated(
        repair_request_id=req.id,
        repair_number=req.repair_number,
        appointment_id=appt.id, # type: ignore
        conversation_id=conv.id, # type: ignore
    )
