from fastapi import APIRouter, HTTPException, Query, Request, Response

from src.models.users import UserRole
from src.security.auth import check_user_role
from src.sql import administration as admin_sql

router = APIRouter()

AUTHORIZED_ROLE = [UserRole.SUPER_ADMIN, UserRole.ADMIN]


@router.get("/get-users")
def get_users(
    request: Request,
    response: Response,
    page: int = Query(1, ge=1),
    how_many: int = Query(10, ge=1, le=30),
    search: str = Query("")
):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    return admin_sql.get_users(how_many, page, search)


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

    return admin_sql.set_user_active(user_id, is_active)
