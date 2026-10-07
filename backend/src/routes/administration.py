from fastapi import APIRouter, HTTPException, Query, Request, Response

from src.models.users import UserRole
from src.schemas.administration import GetUsers
from src.security.auth import check_user_role
from src.services.administration import get_current_user_id
from src.sql import administration as admin_sql
from src.sql import auth as auth_sql

router = APIRouter()

AUTHORIZED_ROLE = [UserRole.SUPER_ADMIN, UserRole.ADMIN]


@router.get("/get-users")
def get_users(
    request: Request,
    response: Response,
    page: int = Query(1, ge=1),
    how_many: int = Query(10, ge=1, le=30),
    search: str = Query(""),
    role: str = Query("")
):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    return admin_sql.get_users(how_many, page, search, role)


@router.get("/get-total-users")
def get_total_users(request: Request, response: Response):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    return admin_sql.get_total_users()


@router.post("/set-user-active")
def set_user_active(
    request: Request,
    response: Response,
    user_id: int,
    is_active: bool,
):
    if not check_user_role(request, response, [UserRole.SUPER_ADMIN]):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    current_user_id = get_current_user_id(request)

    # Can't suspend yourself
    if current_user_id == user_id and is_active is False:
        raise HTTPException(
            status_code=400,
            detail="You cannot suspend your own account",
        )

    state = admin_sql.get_user_state(user_id)
    if state is None:
        raise HTTPException(status_code=404, detail="User not found")

    target_role, target_is_active = state

    # Only block if: target is an active super admin AND we're suspending
    # AND they're the only active super admin left
    suspending = is_active is False
    target_is_active_super = target_role == "SUPER_ADMIN" and target_is_active is True

    if ( suspending and target_is_active_super ) and ( admin_sql.count_active_super_admins() <= 1):
            raise HTTPException(
                status_code=400,
                detail="Cannot suspend the last remaining active super admin",
            )

    return admin_sql.set_user_active(user_id, is_active)


@router.post("/edit-user")
def edit_user(
    request: Request,
    response: Response,
    user: GetUsers
):
    if not check_user_role(request, response, [UserRole.SUPER_ADMIN]):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    current_user_id = get_current_user_id(request)

    if not user.email or not user.email.strip():
            raise HTTPException(
                status_code=400,
                detail="Email cannot be empty",
            )


    state = admin_sql.get_user_state(user.id)
    if state is None:
        raise HTTPException(status_code=404, detail="User not found")

    target_role, target_is_active = state

    if current_user_id == user.id and user.role != target_role:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role",
        )
    existing = auth_sql.get_user_by_email(user.email)
    if existing is not None and existing.id != user.id:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered to another account",
        )

    demoting = target_role == "SUPER_ADMIN" and user.role != "SUPER_ADMIN"

    if demoting and target_is_active:
        active_super_admins = admin_sql.count_active_super_admins()
        if active_super_admins <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the last remaining active super admin",
            )

    if not admin_sql.edit_user(user):
        raise HTTPException(
            status_code=400,
            detail="failed to edit user",
        )
    return "ok"


@router.post("/reset-user-password")
def reset_user_pasword(
    request: Request,
    response: Response,
    user_id: int
):
    if not check_user_role(request, response, [UserRole.SUPER_ADMIN]):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )


    raw_password = admin_sql.reset_user_password(user_id)
    if not raw_password:
        raise HTTPException( status_code=400, detail="Failed to reset password")
    return raw_password

