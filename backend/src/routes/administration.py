from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse

from src.models.users import UserRole
from src.schemas.administration import GetUsers
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

