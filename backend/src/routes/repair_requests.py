import logging
from calendar import day_name
from datetime import date, datetime
from urllib.parse import quote
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Body, HTTPException, Query, Request
from fastapi.responses import FileResponse

from src.config import limiter
from src.models.enums import UserRole
from src.schemas.repair_note import CreateNoteRequest
from src.schemas.repair_part import AddPartRequest
from src.schemas.repair_request import (
    CreateRepairRequestRequest,
    RepairRequestCreated,
    UpdateEstimateRequest,
)
from src.services import notification as notif_service
from src.services.activity_log import record_activity
from src.services.auth import require_active_user as _require_user
from src.services.receipt import (
    ensure_receipt_file,
    receipt_file_storage_path,
    resolve_receipt_file,
)
from src.services.store_settings import read_settings
from src.sql import repair_note as note_sql
from src.sql import repair_part as rp_sql
from src.sql import repair_request as rr_sql
from src.sql.auth import get_user_by_id

router = APIRouter()
logger = logging.getLogger(__name__)

DAY_CAPACITY = 6
BUSINESS_TIMEZONE = ZoneInfo("Asia/Manila")


def _validate_preferred_datetime(
    body: CreateRepairRequestRequest,
    available_times: list[str],
    available_days: list[int],
):
    now = datetime.now(BUSINESS_TIMEZONE)
    preferred_dt = datetime.combine(
        body.preferred_date,
        body.preferred_time,
        tzinfo=BUSINESS_TIMEZONE,
    )

    if preferred_dt < now:
        raise HTTPException(status_code=400, detail="Preferred date and time must be in the future")

    if (body.preferred_date - now.date()).days > 31:
        raise HTTPException(status_code=400, detail="Preferred date must be within 14 days")

    if body.preferred_date.isoweekday() not in available_days:
        available_day_names = [day_name[day - 1] for day in available_days]
        if len(available_day_names) == 1:
            detail = f"That date isn't available. The only available day is {available_day_names[0]}."
        else:
            detail = f"That date isn't available. Available days are {', '.join(available_day_names)}."
        raise HTTPException(status_code=400, detail=detail)

    preferred_time = body.preferred_time.strftime("%H:%M")
    if preferred_time not in available_times:
        raise HTTPException(
            status_code=400,
            detail="That appointment time is no longer available. Choose another time.",
        )


@router.post("", response_model=RepairRequestCreated)
@limiter.limit("3/minutes")
async def create_repair_request(
    body: CreateRepairRequestRequest,
    request: Request,
):
    user = _require_user(request)
    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    customer_id = user.id
    is_admin = user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN)
    if is_admin and body.customer_id is None:
        raise HTTPException(status_code=400, detail="Select a customer for this repair request")
    if body.customer_id is not None:
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only administrators can select a customer")
        customer = get_user_by_id(body.customer_id)
        if customer is None or customer.role != UserRole.CUSTOMER:
            raise HTTPException(status_code=404, detail="Customer not found")
        customer_id = customer.id  # type: ignore[assignment]

    store_settings = read_settings()
    _validate_preferred_datetime(
        body,
        store_settings.available_times,
        store_settings.available_days,
    )

    count = rr_sql.count_appointments_for_day(body.preferred_date)
    if count >= DAY_CAPACITY:
        raise HTTPException(
            status_code=409,
            detail="That day is fully booked. Please choose another date.",
        )

    # find-or-create the device for this customer
    device = rr_sql.find_device(customer_id, body.computer_name) # type: ignore
    if device is None:
        device = rr_sql.create_device(
            customer_id=customer_id, # type: ignore
            computer_name=body.computer_name,
            computer_type=body.computer_type,
            serial_number=body.serial_number,
        )

    if device.id is None:
        raise HTTPException(status_code=500, detail="Failed to create device")

    req = rr_sql.create_repair_request(
        customer_id=customer_id, # type: ignore
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
        customer_id=customer_id, # type: ignore
        repair_request_id=req.id,
    )

    customer = get_user_by_id(customer_id) # type: ignore
    customer_name = " ".join(
        p for p in [customer.first_name or "", customer.last_name or ""] if p # type: ignore
    ).strip() or customer.email # type: ignore

    record_activity(
        user.id,
        "REPAIR_REQUEST_CREATED",
        f"Created repair request {req.repair_number} for {customer_name}.",
        target_type="repair",
        target_id=req.id,
        details={
            "repair_number": req.repair_number,
            "customer_id": customer_id,
            "computer_name": device.computer_name,
            "requested_service": body.requested_service,
        },
    )

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


@router.get("/devices")
def list_team_devices(request: Request):
    user = _require_user(request)
    if user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Forbidden")

    return rr_sql.list_devices_for_team()


@router.get("/workspace")
def get_workspace(request: Request):
    user = _require_user(request)

    if user.role != UserRole.TECHNICIAN:
        raise HTTPException(status_code=403, detail="Forbidden")

    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    summary = rr_sql.get_workspace_summary(user.id)
    items = rr_sql.list_assigned_repairs(user.id)

    return {"summary": summary, "items": items}


@router.patch("/{repair_request_id}/technician")
def assign_repair_technician(
    repair_request_id: int,
    request: Request,
    technician_id: int | None = Body(..., embed=True),
):
    user = _require_user(request)
    if user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Only administrators can assign technicians.")

    try:
        status = rr_sql.assign_repair_technician(repair_request_id, technician_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if status is None:
        raise HTTPException(status_code=404, detail="Repair request not found.")
    technician = get_user_by_id(technician_id) if technician_id is not None else None
    technician_name = " ".join(
        part for part in ((technician.first_name or ""), (technician.last_name or "")) if part
    ).strip() if technician else "Unassigned"
    detail = rr_sql.get_repair_detail(repair_request_id)
    repair_number = detail["repair_number"] if detail else str(repair_request_id)
    record_activity(
        user.id,
        "REPAIR_TECHNICIAN_ASSIGNED" if technician_id is not None else "REPAIR_TECHNICIAN_UNASSIGNED",
        f"{('Assigned ' + technician_name + ' to') if technician_id is not None else 'Unassigned the technician from'} repair {repair_number}.",
        target_type="repair",
        target_id=repair_request_id,
        details={"technician_id": technician_id, "status": status},
    )
    return {"status": status, "technician_id": technician_id}


@router.patch("/technicians/{technician_id}/unassign")
def unassign_technician_repairs(technician_id: int, request: Request):
    user = _require_user(request)
    if user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Only administrators can unassign technicians.")

    count = rr_sql.unassign_open_repairs_for_technician(technician_id)
    if count:
        technician = get_user_by_id(technician_id)
        technician_name = " ".join(
            part for part in ((technician.first_name or ""), (technician.last_name or "")) if part
        ).strip() if technician else f"technician {technician_id}"
        record_activity(
            user.id, "REPAIRS_UNASSIGNED",
            f"Unassigned {count} open repair(s) from {technician_name}.",
            target_type="technician", target_id=technician_id,
            details={"unassigned_count": count},
        )
    return {"unassigned_count": count}


@router.get("/overview")
def customer_overview(request: Request):
    user = _require_user(request)

    if user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    if user.id is None:
        raise HTTPException(status_code=400, detail="User ID is required")

    return rr_sql.get_customer_overview(user.id)


@router.get("/by-number/{repair_number}")
def get_repair_by_number(repair_number: str, request: Request):
    user = _require_user(request)

    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    detail = rr_sql.get_repair_detail_by_number(repair_number.strip().upper())
    if detail is None:
        raise HTTPException(status_code=404, detail="Repair not found")

    return detail


@router.get("/pos-recent")
def list_pos_recent(request: Request):
    user = _require_user(request)

    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    return rr_sql.list_recent_repairs_for_pos()


@router.get("/pos-search")
def search_pos_repairs(
    request: Request,
    search: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(6, ge=1, le=50),
):
    user = _require_user(request)

    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    return rr_sql.search_repairs_for_pos(search, page, page_size)


@router.post("/{repair_request_id}/checkout")
async def checkout_repair_route(repair_request_id: int, request: Request):
    """Release the repair — the customer has picked it up."""
    user = _require_user(request)

    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")

    detail = rr_sql.get_repair_detail(repair_request_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Repair not found")

    if user.id is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    new_status, customer_id = rr_sql.checkout_repair(repair_request_id, user.id)

    if new_status is None or customer_id is None:
        raise HTTPException(
            status_code=400,
            detail="Repair cannot be checked out in its current state.",
        )

    record_activity(
        user.id, "REPAIR_CHECKED_OUT",
        f"Checked out repair {detail['repair_number']}.",
        target_type="repair", target_id=repair_request_id,
        details={"repair_number": detail["repair_number"], "new_status": new_status},
    )

    receipt_ready = False
    receipt_data = rr_sql.get_repair_receipt_data(repair_request_id)
    if receipt_data is not None:
        try:
            path, _ = ensure_receipt_file(receipt_data)
            receipt_ready = rr_sql.set_repair_receipt_path(
                repair_request_id,
                receipt_file_storage_path(path),
            )
        except Exception:
            logger.exception("Failed to save receipt for repair %s", repair_request_id)

    await notif_service.notify_customer_status_changed(
        customer_id=customer_id,
        repair_request_id=repair_request_id,
        repair_number=detail["repair_number"],
        new_status=new_status,
    )

    return {
        "status": new_status,
        "receipt_url": f"/repair-requests/{repair_request_id}/receipt",
        "receipt_ready": receipt_ready,
    }



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


@router.get("/{repair_request_id}/receipt")
def get_repair_receipt(
    repair_request_id: int,
    request: Request,
    download: bool = Query(False),
):
    user = _require_user(request)
    access = rr_sql.get_repair_receipt_access(repair_request_id)
    if access is None:
        raise HTTPException(status_code=404, detail="Receipt not found")
    if user.role == UserRole.CUSTOMER and access["customer_id"] != user.id:
        raise HTTPException(status_code=404, detail="Receipt not found")

    path = (
        resolve_receipt_file(access["receipt_path"])
        if access["receipt_path"]
        else None
    )
    if path is None:
        receipt_data = rr_sql.get_repair_receipt_data(repair_request_id)
        if receipt_data is None:
            raise HTTPException(status_code=404, detail="Receipt not found")
        try:
            path, _ = ensure_receipt_file(receipt_data)
            rr_sql.set_repair_receipt_path(
                repair_request_id,
                receipt_file_storage_path(path),
            )
        except Exception as exc:
            logger.exception("Failed to generate receipt for repair %s", repair_request_id)
            raise HTTPException(status_code=500, detail="Unable to generate receipt") from exc

    disposition = "attachment" if download else "inline"
    return FileResponse(
        path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'{disposition}; filename="{quote(path.name)}"',
            "Cache-Control": "private, no-store",
        },
    )



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

    current_detail = rr_sql.get_repair_detail(repair_request_id)
    if current_detail is None:
        raise HTTPException(status_code=404, detail="Repair not found")
    if current_detail["status"] == "COMPLETED" and not current_detail["checked_out"]:
        raise HTTPException(
            status_code=400,
            detail="Complete checkout in POS before releasing this repair.",
        )

    tech_id = user.id if user.role == UserRole.TECHNICIAN else None

    new_status, customer_id = rr_sql.advance_repair_status(repair_request_id, tech_id)

    if new_status is None or customer_id is None:
        raise HTTPException(status_code=400, detail="This repair cannot be advanced further.")

    record_activity(
        user.id, "REPAIR_STATUS_CHANGED",
        f"Changed repair {current_detail['repair_number']} from {current_detail['status']} to {new_status}.",
        target_type="repair", target_id=repair_request_id,
        details={"repair_number": current_detail["repair_number"], "from": current_detail["status"], "to": new_status},
    )

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

    previous_detail = rr_sql.get_repair_detail(repair_request_id)
    if previous_detail is None:
        raise HTTPException(status_code=404, detail="Repair not found")

    tech_id = user.id if user.role == UserRole.TECHNICIAN else None

    new_status, customer_id = rr_sql.reject_repair(repair_request_id, tech_id)

    if new_status is None or customer_id is None:
        raise HTTPException(status_code=400, detail="This repair cannot be rejected.")

    record_activity(
        user.id, "REPAIR_REJECTED",
        f"Rejected repair {previous_detail['repair_number']}.",
        target_type="repair", target_id=repair_request_id,
        details={"repair_number": previous_detail["repair_number"], "from": previous_detail["status"], "to": new_status},
    )

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

    detail = rr_sql.get_repair_detail(repair_request_id)
    record_activity(
        user.id, "REPAIR_ESTIMATE_UPDATED",
        f"Updated the estimate for repair {detail['repair_number'] if detail else repair_request_id} to {float(body.amount):.2f}.",
        target_type="repair", target_id=repair_request_id,
        details={"amount": float(body.amount)},
    )

    return {"amount": float(body.amount)}
