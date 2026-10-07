import secrets
import string
from datetime import datetime, timezone

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, func, select, text

from src.database import engine
from src.models.enums import UserRole
from src.models.users import Users
from src.schemas.administration import GetUsers
from src.security.passwords import hash_password


def get_users(how_many: int = 10, page: int = 1, search: str = "", role: str = "") -> list[GetUsers]:
    """
    raw dog sql
    """
    how_many = max(0, min(how_many, 30))

    page = max(1, page)
    
    db_offset = (page - 1) * how_many
    role = role.strip()
    search = search.strip()

    try:
        with Session(engine) as s:
            if role == "ADMIN":
                sql = text("""
                    SELECT * FROM users
                    WHERE (first_name ILIKE :search OR last_name ILIKE :search OR email ILIKE :search)
                    AND role IN ('ADMIN', 'SUPER_ADMIN')
                    ORDER BY id
                    LIMIT :limit OFFSET :offset
                """)
                params = {
                    "search": f"%{search}%",
                    "limit": how_many,
                    "offset": db_offset,
                }
            elif role:
                sql = text("""
                    SELECT * FROM users
                    WHERE (first_name ILIKE :search OR last_name ILIKE :search OR email ILIKE :search)
                    AND role = CAST(:role AS userrole)
                    ORDER BY id
                    LIMIT :limit OFFSET :offset
                """)
                params = {
                    "search": f"%{search}%",
                    "role": role,
                    "limit": how_many,
                    "offset": db_offset,
                }
            else:
                sql = text("""
                    SELECT * FROM users
                    WHERE (first_name ILIKE :search OR last_name ILIKE :search OR email ILIKE :search)
                    ORDER BY id
                    LIMIT :limit OFFSET :offset
                """)
                params = {
                    "search": f"%{search}%",
                    "limit": how_many,
                    "offset": db_offset,
                }

            rows = s.execute(sql, params).mappings().all()
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


def set_user_active(user_id: int, is_active: bool) -> bool:
    try:
        with Session(engine) as s:
            user = s.get(Users, user_id)
            if not user:
                return False
            user.is_active = is_active
            s.commit()
        return True
    except SQLAlchemyError as e:
        print(f"set_user_active failed: {e}")
        return False

def edit_user(user: GetUsers) -> bool:
    try:
        with Session(engine) as s:
            db_user = s.get(Users, user.id)
            if not db_user:
                return False

            db_user.first_name = user.first_name
            db_user.last_name = user.last_name
            db_user.email = user.email
            db_user.role = UserRole(user.role)
            db_user.updated_at = datetime.now(timezone.utc)

            s.commit()
        return True
    except SQLAlchemyError as e:
        print(f"edit_user failed: {e}")
        return False

def get_user_role(user_id: int) -> str | None:
    with Session(engine) as s:
        user = s.get(Users, user_id)
        if not user:
            return None
        return user.role.value


def count_active_super_admins() -> int:
    with Session(engine) as s:
        return s.exec(
            select(func.count())
            .select_from(Users)
            .where(Users.role == UserRole.SUPER_ADMIN)
            .where(Users.is_active == True)
        ).one()


def get_user_state(user_id: int) -> tuple[str, bool] | None:
    with Session(engine) as s:
        user = s.get(Users, user_id)
        if not user:
            return None
        return user.role.value, user.is_active




# def reset_user_password(user_id: int) -> str:
#     try:
#         with Session(engine) as s:
#             user = s.get(Users, user_id)
#             if not user:
#                 return ""
#
#             alphabet = string.ascii_letters + string.digits
#             raw_password = "".join(secrets.choice(alphabet) for _ in range(8))
#
#             user.password_hash = hash_password(raw_password)
#             user.updated_at = datetime.now(timezone.utc)
#             s.commit()
#
#             return raw_password
#     except SQLAlchemyError as e:
#         print(f"reset_user_password failed: {e}")
#         return ""
def reset_user_password(user_id: int) -> str:
    try:
        alphabet = string.ascii_letters + string.digits
        raw_password = "".join(secrets.choice(alphabet) for _ in range(8))
        hashed = hash_password(raw_password)

        with Session(engine) as s:
            result = s.execute(
                text("""
                    UPDATE users
                    SET password_hash = :password_hash,
                        updated_at = :updated_at
                    WHERE id = :user_id
                """),
                {
                    "password_hash": hashed,
                    "updated_at": datetime.now(timezone.utc),
                    "user_id": user_id,
                },
            )
            s.commit()

            if result.rowcount == 0: # type: ignore
                return ""

        return raw_password
    except SQLAlchemyError as e:
        print(f"reset_user_password failed: {e}")
        return ""
