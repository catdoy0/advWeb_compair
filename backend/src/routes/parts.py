from fastapi import APIRouter, HTTPException, Query, Request

from src.models.users import UserRole
from src.schemas.part import (
    CreatePartRequest,
    RestockPartRequest,
    UpdatePartRequest,
)
from src.services.auth import get_current_user_id
from src.sql import part as part_sql
from src.sql.auth import get_user_by_id

router = APIRouter()

INVENTORY_WRITERS = [UserRole.STAFF, UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.SUPER_ADMIN]


def _require_user(request: Request):
    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = get_user_by_id(user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=403, detail="Account is unavailable")

    return user


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
):
    user = _require_user(request)
    _require_team(user)

    return part_sql.list_parts(
        search=search,
        category=category,
        low_stock_only=low_stock_only,
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

    return {"id": part.id, "sku": part.sku}


@router.patch("/{part_id}")
def update_part(
    part_id: int,
    body: UpdatePartRequest,
    request: Request,
):
    user = _require_user(request)
    _require_admin(user)

    ok = part_sql.update_part(part_id, body)
    if not ok:
        raise HTTPException(status_code=404, detail="Part not found")

    return {"ok": True}


@router.post("/{part_id}/restock")
def restock_part(
    part_id: int,
    body: RestockPartRequest,
    request: Request,
):
    user = _require_user(request)
    _require_admin(user)

    ok = part_sql.restock_part(part_id, body.amount)
    if not ok:
        raise HTTPException(status_code=404, detail="Part not found")

    return {"ok": True}


@router.delete("/{part_id}")
def deactivate_part(part_id: int, request: Request):
    user = _require_user(request)
    _require_admin(user)

    ok = part_sql.deactivate_part(part_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Part not found")

    return {"ok": True}
