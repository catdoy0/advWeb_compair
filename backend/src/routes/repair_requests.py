from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Query, Request

from src.models.enums import UserRole
from src.schemas.repair_note import CreateNoteRequest
from src.schemas.repair_part import AddPartRequest
from src.schemas.repair_request import (
    CreateRepairRequestRequest,
    RepairRequestCreated,
    UpdateEstimateRequest,
)
from src.services import notification as notif_service
from src.services.auth import get_current_user_id
from src.sql import repair_note as note_sql
from src.sql import repair_part as rp_sql
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


@router.post("", response_model=RepairRequestCreated)
async def create_repair_request(
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

    customer = get_user_by_id(user.id)
    customer_name = " ".join(
        p for p in [customer.first_name or "", customer.last_name or ""] if p # type: ignore
    ).strip() or customer.email # type: ignore

    await notif_service.notify_team_new_repair_request(
        repair_request_id=req.id,
        repair_number=req.repair_number,
        customer_name=customer_name,
        computer_name=device.computer_name,
    )

    return RepairRequestCreated(
        repair_request_id=req.id,
        repair_number=req.repair_number,
        appointment_id=appt.id, # type: ignore
        conversation_id=conv.id, # type: ignore
    )


@router.get("")
def list_repair_queue(
    request: Request,
    status: str | None = Query(None),
    search: str = Query(""),
):
    user = _require_user(request)

    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    items = rr_sql.list_repair_queue(status, search)
    counts = rr_sql.count_repair_queue_by_status()

    return {"items": items, "counts": counts}




@router.get("/my-devices")
def list_my_devices(request: Request):
    user = _require_user(request)

    if user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    return rr_sql.list_devices_for_customer(user.id)


@router.get("/{repair_request_id}")
def get_repair(
    repair_request_id: int,
    request: Request,
):
    user = _require_user(request)

    detail = rr_sql.get_repair_detail(repair_request_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Repair not found")

    if user.role == UserRole.CUSTOMER and detail["customer_id"] != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return detail



@router.get("/{repair_request_id}/notes")
def list_repair_notes(repair_request_id: int, request: Request):
    user = _require_user(request)

    # customers can read notes on their own repairs
    if user.role == UserRole.CUSTOMER:
        detail = rr_sql.get_repair_detail(repair_request_id)
        if detail is None:
            raise HTTPException(status_code=404, detail="Repair not found")
        if detail["customer_id"] != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    repair = note_sql.get_or_create_repair(repair_request_id)
    if repair is None or repair.id is None:
        raise HTTPException(status_code=500, detail="Failed to resolve repair")

    return note_sql.list_notes(repair.id)


@router.post("/{repair_request_id}/notes")
def add_repair_note(
    repair_request_id: int,
    body: CreateNoteRequest,
    request: Request,
):
    user = _require_user(request)
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    repair = note_sql.get_or_create_repair(repair_request_id)
    if repair is None or repair.id is None:
        raise HTTPException(status_code=500, detail="Failed to resolve repair")

    note = note_sql.create_note(
        repair_id=repair.id,
        author_id=user.id,
        note=body.note.strip(),
    )

    return {"id": note.id}


# ---------- parts ----------

@router.get("/{repair_request_id}/parts")
def list_repair_parts(repair_request_id: int, request: Request):
    user = _require_user(request)

    if user.role == UserRole.CUSTOMER:
        detail = rr_sql.get_repair_detail(repair_request_id)
        if detail is None:
            raise HTTPException(status_code=404, detail="Repair not found")
        if detail["customer_id"] != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    repair = note_sql.get_or_create_repair(repair_request_id)
    if repair is None or repair.id is None:
        raise HTTPException(status_code=500, detail="Failed to resolve repair")

    return rp_sql.list_parts_for_repair(repair.id)


@router.post("/{repair_request_id}/parts")
def add_repair_part(
    repair_request_id: int,
    body: AddPartRequest,
    request: Request,
):
    user = _require_user(request)
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    repair = note_sql.get_or_create_repair(repair_request_id)
    if repair is None or repair.id is None:
        raise HTTPException(status_code=500, detail="Failed to resolve repair")

    row, error = rp_sql.add_part_to_repair(
        repair_id=repair.id,
        part_id=body.part_id,
        quantity_used=body.quantity_used,
        work_note=body.work_note,
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return row


@router.delete("/{repair_request_id}/parts/{repair_part_id}")
def remove_repair_part(
    repair_request_id: int,
    repair_part_id: int,
    request: Request,
):
    user = _require_user(request)
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    ok = rp_sql.remove_part_from_repair(repair_part_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Part usage not found")

    return {"ok": True}



@router.post("/{repair_request_id}/advance")
async def advance_repair(repair_request_id: int, request: Request):
    user = _require_user(request)
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    tech_id = user.id if user.role == UserRole.TECHNICIAN else None

    new_status, customer_id = rr_sql.advance_repair_status(repair_request_id, tech_id)

    if new_status is None or customer_id is None:
        raise HTTPException(status_code=400, detail="This repair cannot be advanced further.")

    detail = rr_sql.get_repair_detail(repair_request_id)
    repair_number = detail["repair_number"] if detail else ""

    await notif_service.notify_customer_status_changed(
        customer_id=customer_id,
        repair_request_id=repair_request_id,
        repair_number=repair_number,
        new_status=new_status,
    )

    return {"status": new_status}


@router.post("/{repair_request_id}/reject")
async def reject_repair(repair_request_id: int, request: Request):
    user = _require_user(request)
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    tech_id = user.id if user.role == UserRole.TECHNICIAN else None

    new_status, customer_id = rr_sql.reject_repair(repair_request_id, tech_id)

    if new_status is None or customer_id is None:
        raise HTTPException(status_code=400, detail="This repair cannot be rejected.")

    detail = rr_sql.get_repair_detail(repair_request_id)
    repair_number = detail["repair_number"] if detail else ""

    await notif_service.notify_customer_status_changed(
        customer_id=customer_id,
        repair_request_id=repair_request_id,
        repair_number=repair_number,
        new_status=new_status,
    )

    return {"status": new_status}


@router.patch("/{repair_request_id}/estimate")
def update_estimate(
    repair_request_id: int,
    body: UpdateEstimateRequest,
    request: Request,
):
    user = _require_user(request)
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    ok = rr_sql.set_estimate_amount(repair_request_id, float(body.amount))
    if not ok:
        raise HTTPException(status_code=400, detail="Failed to update estimate")

    return {"amount": float(body.amount)}
