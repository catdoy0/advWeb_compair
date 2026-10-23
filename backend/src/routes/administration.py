from datetime import date

from fastapi import APIRouter, HTTPException, Query, Request, Response

from src.models.users import UserRole
from src.schemas.administration import GetUsers
from src.security.auth import check_user_role
from src.services.auth import get_current_user_id
from src.services.activity_log import list_activity_logs, record_activity
from src.sql import administration as admin_sql
from src.sql import auth as auth_sql
from src.sql import conversation as conversation_sql

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


@router.get("/overview")
def get_admin_overview(
    request: Request,
    response: Response,
    on_date: str | None = Query(None),
):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    try:
        overview_date = date.fromisoformat(on_date) if on_date else date.today()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Date must use YYYY-MM-DD format") from exc

    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    return admin_sql.get_admin_overview(overview_date, user_id)


@router.get("/customers")
def get_customers(
    request: Request,
    response: Response,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=30),
    search: str = Query("", max_length=200),
):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    return admin_sql.get_customers(page, page_size, search)


@router.get("/activity-logs")
def get_activity_logs(
    request: Request,
    response: Response,
    search: str = Query("", max_length=200),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(status_code=403, detail="Only administrators can view activity logs")
    return list_activity_logs(search, page_size, (page - 1) * page_size)


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

    target = admin_sql.get_user_identity(user_id)
    updated = admin_sql.set_user_active(user_id, is_active)
    if updated:
        label = " ".join(part for part in ((target or {}).get("first_name") or "", (target or {}).get("last_name") or "") if part).strip()
        record_activity(
            current_user_id,
            "ACCOUNT_SUSPENDED" if not is_active else "ACCOUNT_REACTIVATED",
            f"{'Suspended' if not is_active else 'Reactivated'} account {label or 'account'} ({(target or {}).get('email', user_id)}).",
            target_type="account",
            target_id=user_id,
            details={"is_active": is_active},
        )
    return updated


@router.get("/archive/messages")
def get_archived_messages(
    request: Request,
    response: Response,
    search: str = Query("", max_length=200),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(status_code=403, detail="You do not have permission to view archived messages")
    return conversation_sql.list_archived_conversations(search, page_size, (page - 1) * page_size)


@router.post("/archive/messages/{conversation_id}")
def archive_message_conversation(
    conversation_id: int,
    request: Request,
    response: Response,
):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(status_code=403, detail="You do not have permission to archive messages")
    eligible = conversation_sql.can_archive_conversation(conversation_id)
    if eligible is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if not eligible:
        raise HTTPException(
            status_code=400,
            detail="Only repair conversations with a completed, released, or rejected request can be archived",
        )
    if not conversation_sql.archive_conversation(conversation_id):
        raise HTTPException(status_code=409, detail="Conversation changed before it could be archived")
    record_activity(
        get_current_user_id(request), "CONVERSATION_ARCHIVED",
        f"Archived conversation {conversation_id}.", target_type="conversation", target_id=conversation_id,
    )
    return {"message": "Conversation archived."}


@router.post("/archive/messages/{conversation_id}/restore")
def restore_message_conversation(
    conversation_id: int,
    request: Request,
    response: Response,
):
    if not check_user_role(request, response, AUTHORIZED_ROLE):
        raise HTTPException(status_code=403, detail="You do not have permission to restore messages")
    if not conversation_sql.restore_conversation(conversation_id):
        raise HTTPException(status_code=404, detail="Archived conversation not found")
    record_activity(
        get_current_user_id(request), "CONVERSATION_RESTORED",
        f"Restored conversation {conversation_id}.", target_type="conversation", target_id=conversation_id,
    )
    return {"message": "Conversation restored."}


@router.get("/archive/accounts")
def get_archived_accounts(
    request: Request,
    response: Response,
    search: str = Query("", max_length=200),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    if not check_user_role(request, response, [UserRole.SUPER_ADMIN]):
        raise HTTPException(status_code=403, detail="Only super admins can view archived accounts")
    return admin_sql.list_archived_users(search, page_size, (page - 1) * page_size)


@router.post("/archive/accounts/{user_id}")
def archive_account(user_id: int, request: Request, response: Response):
    if not check_user_role(request, response, [UserRole.SUPER_ADMIN]):
        raise HTTPException(status_code=403, detail="Only super admins can archive accounts")

    if get_current_user_id(request) == user_id:
        raise HTTPException(status_code=400, detail="You cannot archive your own account")

    state = admin_sql.get_user_state(user_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Account not found")
    target_role, target_is_active = state
    if (
        target_role == UserRole.SUPER_ADMIN.value
        and target_is_active
        and admin_sql.count_active_super_admins() <= 1
    ):
        raise HTTPException(status_code=400, detail="Cannot archive the last active super admin")
    target = admin_sql.get_user_identity(user_id)
    if not admin_sql.archive_user(user_id):
        raise HTTPException(status_code=404, detail="Account not found or already archived")
    record_activity(
        get_current_user_id(request), "ACCOUNT_ARCHIVED",
        f"Archived account {(target or {}).get('email', user_id)}.", target_type="account", target_id=user_id,
    )
    return {"message": "Account archived."}


@router.post("/archive/accounts/{user_id}/restore")
def restore_account(user_id: int, request: Request, response: Response):
    if not check_user_role(request, response, [UserRole.SUPER_ADMIN]):
        raise HTTPException(status_code=403, detail="Only super admins can restore accounts")
    target = admin_sql.get_user_identity(user_id)
    if not admin_sql.restore_user(user_id):
        raise HTTPException(status_code=404, detail="Archived account not found")
    record_activity(
        get_current_user_id(request), "ACCOUNT_RESTORED",
        f"Restored account {(target or {}).get('email', user_id)}.", target_type="account", target_id=user_id,
    )
    return {"message": "Account restored."}


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

    if target_role == UserRole.TECHNICIAN.value and user.role != UserRole.TECHNICIAN.value:
        assigned_jobs = admin_sql.count_open_assigned_repairs(user.id)
        if assigned_jobs:
            raise HTTPException(
                status_code=400,
                detail=f"This technician has {assigned_jobs} open assigned repair(s). Reassign or close them before changing the role.",
            )

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

    previous_user = auth_sql.get_user_by_id(user.id)
    if not admin_sql.edit_user(user):
        raise HTTPException(
            status_code=400,
            detail="failed to edit user",
        )
    changed = {}
    if previous_user:
        for key, before, after in (
            ("first_name", previous_user.first_name, user.first_name),
            ("last_name", previous_user.last_name, user.last_name),
            ("email", previous_user.email, user.email),
            ("role", previous_user.role.value, user.role),
        ):
            if before != after:
                changed[key] = {"from": before, "to": after}
    target_name = " ".join(part for part in (user.first_name or "", user.last_name or "") if part).strip() or user.email
    description = f"Updated account {target_name}."
    if "first_name" in changed or "last_name" in changed:
        description = f"Changed account name to {target_name}."
    record_activity(
        current_user_id, "ACCOUNT_UPDATED", description,
        target_type="account", target_id=user.id, details=changed,
    )
    return "ok"


@router.post("/reset-user-password")
def reset_user_password(
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
        raise HTTPException(status_code=400, detail="Failed to reset password")

    target = auth_sql.get_user_by_id(user_id)
    record_activity(
        get_current_user_id(request), "PASSWORD_RESET_BY_ADMIN",
        f"Reset the password for {target.email if target else f'account {user_id}'}.",
        target_type="account", target_id=user_id,
    )
    return {"password": raw_password}
