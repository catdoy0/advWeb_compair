from datetime import datetime, timezone

from sqlalchemy import text
from sqlmodel import Session, select

from src.database import engine
from src.models.parts import Parts
from src.schemas.part import CreatePartRequest, UpdatePartRequest


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- reads ----------

def list_parts(
    search: str = "",
    category: str | None = None,
    low_stock_only: bool = False,
) -> list[dict]:
    sql = """
        SELECT id, name, sku, category, quantity,
            reorder_threshold, unit_price, supplier, is_active,
            created_at, updated_at
        FROM parts
        WHERE is_active = true
    """
    params: dict = {}

    term = search.strip()
    if term:
        sql += " AND (name ILIKE :search OR sku ILIKE :search OR category ILIKE :search)"
        params["search"] = f"%{term}%"

    if category:
        sql += " AND category = :category"
        params["category"] = category

    if low_stock_only:
        sql += " AND quantity <= reorder_threshold"

    sql += " ORDER BY name ASC"

    with Session(engine) as s:
        rows = s.execute(text(sql), params).mappings().all()

    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "name": row["name"],
            "sku": row["sku"],
            "category": row["category"],
            "quantity": row["quantity"],
            "reorder_threshold": row["reorder_threshold"],
            "unit_price": float(row["unit_price"]),
            "supplier": row["supplier"],
            "is_active": row["is_active"],
            "is_low_stock": row["quantity"] <= row["reorder_threshold"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        })

    return result


def get_part(part_id: int) -> dict | None:
    with Session(engine) as s:
        row = s.execute(
            text("""
                SELECT id, name, sku, category, quantity,
                       reorder_threshold, unit_price, supplier, is_active,
                       created_at, updated_at
                FROM parts
                WHERE id = :id
            """),
            {"id": part_id},
        ).mappings().first()

    if row is None:
        return None

    return {
        "id": row["id"],
        "name": row["name"],
        "sku": row["sku"],
        "category": row["category"],
        "quantity": row["quantity"],
        "reorder_threshold": row["reorder_threshold"],
        "unit_price": float(row["unit_price"]),
        "supplier": row["supplier"],
        "is_active": row["is_active"],
        "is_low_stock": row["quantity"] <= row["reorder_threshold"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_categories() -> list[str]:
    with Session(engine) as s:
        rows = s.execute(text("""
            SELECT DISTINCT category
            FROM parts
            WHERE is_active = true
            ORDER BY category ASC
        """)).all()

    return [row[0] for row in rows]


# ---------- writes ----------

def create_part(data: CreatePartRequest) -> Parts | None:
    with Session(engine) as s:
        # SKU must be unique — even against deactivated parts
        existing = s.exec(
            select(Parts).where(Parts.sku == data.sku)
        ).first()
        if existing is not None:
            return None

        part = Parts(
            name=data.name,
            sku=data.sku,
            category=data.category,
            quantity=data.quantity,
            reorder_threshold=data.reorder_threshold,
            unit_price=data.unit_price,
            supplier=data.supplier,
        )
        s.add(part)
        s.commit()
        s.refresh(part)
        return part


def update_part(part_id: int, data: UpdatePartRequest) -> bool:
    with Session(engine) as s:
        part = s.get(Parts, part_id)
        if part is None or not part.is_active:
            return False

        if data.name is not None:
            part.name = data.name
        if data.category is not None:
            part.category = data.category
        if data.reorder_threshold is not None:
            part.reorder_threshold = data.reorder_threshold
        if data.unit_price is not None:
            part.unit_price = data.unit_price
        if data.supplier is not None:
            part.supplier = data.supplier


        part.updated_at = _now()
        s.commit()
        return True


def restock_part(part_id: int, amount: int) -> bool:
    with Session(engine) as s:
        part = s.get(Parts, part_id)
        if part is None or not part.is_active:
            return False

        part.quantity += amount
        part.updated_at = _now()
        s.commit()
        return True


def deactivate_part(part_id: int) -> bool:
    """Soft delete. Historical repair_parts rows keep their reference."""
    with Session(engine) as s:
        part = s.get(Parts, part_id)
        if part is None or not part.is_active:
            return False

        part.is_active = False
        part.updated_at = _now()
        s.commit()
        return True


def get_inventory_summary() -> dict:
    with Session(engine) as s:
        row = s.execute(text("""
            SELECT
                COUNT(*)                                       AS total_skus,
                COUNT(*) FILTER (WHERE quantity <= reorder_threshold) AS needs_reorder,
                COALESCE(SUM(quantity), 0)                     AS units_on_hand,
                COALESCE(SUM(quantity * unit_price), 0)        AS stock_value
            FROM parts
            WHERE is_active = true
        """)).mappings().first()

    if row is None:
        return {
            "total_skus": 0,
            "needs_reorder": 0,
            "units_on_hand": 0,
            "stock_value": 0,
        }

    return {
        "total_skus": row["total_skus"],
        "needs_reorder": row["needs_reorder"],
        "units_on_hand": row["units_on_hand"],
        "stock_value": float(row["stock_value"]),
    }
