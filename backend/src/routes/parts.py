from fastapi import APIRouter, HTTPException, Query, Request

from src.models.users import UserRole
from src.schemas.part import (
    CreatePartRequest,
    RestockPartRequest,
    UpdatePartRequest,
)
from src.services.activity_log import record_activity
from src.services.auth import require_active_user as _require_user
from src.sql import part as part_sql

router = APIRouter()

INVENTORY_WRITERS = [UserRole.STAFF, UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN]


def _require_team(user):
    if user.role == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_admin(user):
    if user.role not in INVENTORY_WRITERS:
        raise HTTPException(status_code=403, detail="Forbidden")


# ---------- reads (any team member) ----------

@router.get("")
def list_parts(
    request: Request,
    search: str = Query(""),
    category: str | None = Query(None),
    low_stock_only: bool = Query(False),
    include_inactive: bool = Query(False),
):
    user = _require_user(request)
    _require_team(user)

    return part_sql.list_parts(
        search=search,
        category=category,
        low_stock_only=low_stock_only,
        include_inactive=include_inactive,
    )


@router.get("/summary")
def inventory_summary(request: Request):
    user = _require_user(request)
    _require_team(user)
    return part_sql.get_inventory_summary()


@router.get("/categories")
def list_categories(request: Request):
    user = _require_user(request)
    _require_team(user)

    return part_sql.list_categories()


@router.get("/{part_id}")
def get_part(part_id: int, request: Request):
    user = _require_user(request)
    _require_team(user)

    part = part_sql.get_part(part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Part not found")

    return part


# ---------- writes (admins only) ----------

@router.post("")
def create_part(
    body: CreatePartRequest,
    request: Request,
):
    user = _require_user(request)
    _require_admin(user)

    part = part_sql.create_part(body)
    if part is None:
        raise HTTPException(
            status_code=409,
            detail="A part with that SKU already exists",
        )

    record_activity(
        user.id,
        "PART_CREATED",
        f"Added inventory part {part.name} ({part.sku}) with {part.quantity} units.",
        target_type="part",
        target_id=part.id,
        details={
            "sku": part.sku,
            "name": part.name,
            "quantity": part.quantity,
            "unit_price": part.unit_price,
        },
    )

    return {"id": part.id, "sku": part.sku}


@router.patch("/{part_id}")
def update_part(
    part_id: int,
    body: UpdatePartRequest,
    request: Request,
):
    user = _require_user(request)
    _require_admin(user)

    previous = part_sql.get_part(part_id)
    if previous is None:
        raise HTTPException(status_code=404, detail="Part not found")

    ok = part_sql.update_part(part_id, body)
    if not ok:
        raise HTTPException(status_code=404, detail="Part not found")

    changes = body.model_dump(exclude_unset=True, exclude_none=True)
    changes.pop("quantity", None)
    quantity_after = body.quantity if body.quantity is not None else previous["quantity"]
    updated_name = body.name or previous["name"]
    updated_sku = previous["sku"]
    description = f"Updated inventory part {updated_name} ({updated_sku})."
    if body.quantity is not None and body.quantity != previous["quantity"]:
        description = (
            f"Updated stock for {updated_name} ({updated_sku}) from "
            f"{previous['quantity']} to {body.quantity} units."
        )

    quantity_changed = body.quantity is not None and body.quantity != previous["quantity"]
    record_activity(
        user.id,
        "PART_STOCK_ADJUSTED" if quantity_changed else "PART_UPDATED",
        description,
        target_type="part",
        target_id=part_id,
        details={
            "sku": updated_sku,
            "changes": changes,
            "quantity_before": previous["quantity"],
            "quantity_after": quantity_after,
            "quantity_change": quantity_after - previous["quantity"],
        },
    )

    return {"ok": True}


@router.post("/{part_id}/restock")
def restock_part(
    part_id: int,
    body: RestockPartRequest,
    request: Request,
):
    user = _require_user(request)
    _require_admin(user)

    part = part_sql.get_part(part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Part not found")

    ok = part_sql.restock_part(part_id, body.amount)
    if not ok:
        raise HTTPException(status_code=404, detail="Part not found")

    record_activity(
        user.id,
        "PART_STOCK_RECEIVED",
        f"Received {body.amount} units of {part['name']} ({part['sku']}); stock is now {part['quantity'] + body.amount}."
        + (f" Reference: {body.reference.strip()}." if body.reference and body.reference.strip() else ""),
        target_type="part",
        target_id=part_id,
        details={
            "sku": part["sku"],
            "quantity_received": body.amount,
            "quantity_before": part["quantity"],
            "quantity_after": part["quantity"] + body.amount,
            "reference": body.reference.strip() if body.reference else None,
        },
    )

    return {"ok": True}


@router.delete("/{part_id}")
def deactivate_part(part_id: int, request: Request):
    user = _require_user(request)
    _require_admin(user)

    part = part_sql.get_part(part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Part not found")

    ok = part_sql.deactivate_part(part_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Part not found")

    record_activity(
        user.id,
        "PART_MARKED_UNAVAILABLE",
        f"Marked inventory part {part['name']} ({part['sku']}) unavailable.",
        target_type="part",
        target_id=part_id,
        details={"sku": part["sku"], "quantity_on_hand": part["quantity"]},
    )

    return {"ok": True}


@router.post("/{part_id}/restore")
def restore_part(part_id: int, request: Request):
    user = _require_user(request)
    _require_admin(user)

    part = part_sql.get_part(part_id)
    if part is None or part["is_active"]:
        raise HTTPException(status_code=404, detail="Inactive part not found")

    ok = part_sql.restore_part(part_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Inactive part not found")

    record_activity(
        user.id,
        "PART_RESTORED",
        f"Restored inventory part {part['name']} ({part['sku']}) to available stock.",
        target_type="part",
        target_id=part_id,
        details={"sku": part["sku"], "quantity_on_hand": part["quantity"]},
    )

    return {"ok": True}
