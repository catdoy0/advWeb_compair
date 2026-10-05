from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, func, select, text

from src.database import engine
from src.models.users import Users
from src.schemas.administration import GetUsers


# def get_users(
#     how_many: int = 10,
#     offset: int = 0,
#     search: str = "",
# ) -> tuple[list[Users], int]:
#     how_many = max(1, min(how_many, 100))
#     offset = max(0, offset)
#
#     with Session(engine) as s:
#         base = select(Users)
#
#         if (term := search.strip()):
#             pattern = f"%{term}%"
#             base = base.where(
#                 or_(
#                     Users.first_name.ilike(pattern),
#                     Users.last_name.ilike(pattern),
#                     Users.email.ilike(pattern),
#                 )
#             )
#
#         total = s.exec(
#             select(func.count()).select_from(base.subquery())
#         ).one()
#
#         rows = s.exec(
#             base.order_by(Users.id).offset(offset).limit(how_many)
#         ).all()
#
#         return list(rows), total
def get_users(how_many: int = 10, page: int = 1, search: str = "") -> list[GetUsers]:
    """
    raw dog sql
    """
    how_many = max(0, min(how_many, 30))

    page = max(1, page)
    
    db_offset = (page - 1) * how_many
    try:
        with Session(engine) as s:
            sql = text("""
                SELECT * FROM users
                WHERE (first_name LIKE :search OR last_name LIKE :search OR email LIKE :search)
                ORDER BY id
                LIMIT :limit OFFSET :offset
            """)
            result = s.execute(sql, {
                "search": f"%{search}%",
                "limit": how_many,
                "offset": db_offset,
            }).mappings()

            rows = result.all()
            # result_list = []
            # for row in rows:
            #     result_list.append({
            #         "id": row["id"],
            #         "first_name": row["first_name"],
            #         "last_name": row["last_name"],
            #         "email": row["email"],
            #         "role": row["role"],
            #         "is_active": row["is_active"]
            #     })
        return [GetUsers(**row) for row in rows]

    except SQLAlchemyError as e:
        print(f"fucked up get_users() {e}")
        return []


def get_total_users():
    with Session(engine) as s:
        rows = s.exec(
            select(Users.role, func.count()).group_by(Users.role)
        ).all()

    counts = {role: count for role, count in rows}

    return {
        "total_accounts": sum(counts.values()),
        "customer_total": counts.get("CUSTOMER", 0),
        "technician_total": counts.get("TECHNICIAN", 0),
        "staff_total": counts.get("STAFF", 0),
        "administrator_total": counts.get("ADMIN", 0) + counts.get("SUPER_ADMIN", 0),
    }

