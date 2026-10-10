from sqlalchemy import text
from sqlmodel import Session

from src.database import engine
from src.models.parts import Parts
from src.models.repair_parts import Repair_Parts


def list_parts_for_repair(repair_id: int) -> list[dict]:
    with Session(engine) as s:
        rows = s.execute(
            text("""
                SELECT
                    rp.id,
                    rp.part_id,
                    rp.quantity_used,
                    rp.unit_price,
                    rp.work_note,
                    rp.created_at,
                    p.name        AS part_name,
                    p.sku         AS part_sku
                FROM repair_parts rp
                JOIN parts p ON p.id = rp.part_id
                WHERE rp.repair_id = :rid
                ORDER BY rp.created_at DESC
            """),
            {"rid": repair_id},
        ).mappings().all()

    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "part_id": row["part_id"],
            "part_name": row["part_name"],
            "part_sku": row["part_sku"],
            "quantity_used": row["quantity_used"],
            "unit_price": float(row["unit_price"]),
            "line_total": float(row["unit_price"]) * row["quantity_used"],
            "work_note": row["work_note"],
            "created_at": row["created_at"],
        })

    return result


def add_part_to_repair(
    repair_id: int,
    part_id: int,
    quantity_used: int,
    work_note: str | None,
) -> tuple[dict | None, str | None]:
    """
    Returns (row_dict, None) on success, (None, error_message) on failure.
    Stock deduction is atomic — a conditional UPDATE that only fires if enough stock exists.
    """
    with Session(engine) as s:
        part = s.get(Parts, part_id)
        if part is None or not part.is_active:
            return None, "Part not found"

        # atomic deduction
        result = s.execute(
            text("""
                UPDATE parts
                SET quantity = quantity - :qty
                WHERE id = :pid AND quantity >= :qty
            """),
            {"qty": quantity_used, "pid": part_id},
        )

        if result.rowcount == 0: # type: ignore
            s.rollback()
            return None, "Insufficient stock"

        row = Repair_Parts(
            repair_id=repair_id,
            part_id=part_id,
            quantity_used=quantity_used,
            unit_price=part.unit_price,
            work_note=work_note,
        )
        s.add(row)

        delta = float(part.unit_price) * quantity_used
        s.execute(
            text("""
                UPDATE repairs
                SET estimate_amount = COALESCE(estimate_amount, 0) + :delta
                WHERE id = :rid
            """),
            {"delta": delta, "rid": repair_id},
        )

        s.commit()
        s.refresh(row)

        return {
            "id": row.id,
            "part_id": part_id,
            "part_name": part.name,
            "part_sku": part.sku,
            "quantity_used": quantity_used,
            "unit_price": float(part.unit_price),
            "line_total": float(part.unit_price) * quantity_used,
            "work_note": work_note,
            "created_at": row.created_at,
        }, None


def remove_part_from_repair(repair_part_id: int) -> bool:
    with Session(engine) as s:
        row = s.get(Repair_Parts, repair_part_id)
        if row is None:
            return False

        s.execute(
            text("UPDATE parts SET quantity = quantity + :qty WHERE id = :pid"),
            {"qty": row.quantity_used, "pid": row.part_id},
        )

        delta = float(row.unit_price) * row.quantity_used
        s.execute(
            text("""
                UPDATE repairs
                SET estimate_amount = GREATEST(COALESCE(estimate_amount, 0) - :delta, 0)
                WHERE id = :rid
            """),
            {"delta": delta, "rid": row.repair_id},
        )

        s.delete(row)
        s.commit()
        return True
