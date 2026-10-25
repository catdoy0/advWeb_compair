from pathlib import Path
from urllib.parse import quote, unquote, urlparse

from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, HTTPException, Request, Response

from src.schemas.profile import ChangeEmail, ChangeName, ChangePassword
from src.services.activity_log import record_activity
from src.services.auth import get_current_user_id
from src.sql import profile as profile_sql
from src.sql.auth import email_exists, get_user_by_id

router = APIRouter()

AVATAR_DIR = Path(__file__).resolve().parents[2] / "assets" / "avatars"
MAX_AVATAR_BYTES = 5 * 1024 * 1024
AVATAR_TYPES = {
    "image/jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
    "image/png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": lambda data: len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP",
}


@router.put("/avatar")
async def upload_avatar(request: Request):
    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    avatar_type = AVATAR_TYPES.get(content_type)
    if avatar_type is None:
        raise HTTPException(status_code=415, detail="Use a JPEG, PNG, or WebP image")
    image_data = await request.body()
    validate_signature = avatar_type
    if not image_data or not validate_signature(image_data):
        raise HTTPException(status_code=400, detail="The image file is invalid")
    if len(image_data) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")

    original_name = unquote(request.headers.get("x-avatar-filename", "")).replace("\\", "/")
    original_name = Path(original_name).name.strip()
    if (
        not original_name
        or original_name in {".", ".."}
        or any(ord(character) < 32 for character in original_name)
    ):
        raise HTTPException(status_code=400, detail="The image filename is invalid")
    file_extension = Path(original_name).suffix.lower()
    valid_extensions = {
        "image/jpeg": {".jpg", ".jpeg"},
        "image/png": {".png"},
        "image/webp": {".webp"},
    }
    if file_extension not in valid_extensions[content_type]:
        raise HTTPException(status_code=400, detail="The filename extension does not match the image type")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    original_path = Path(original_name)
    image_path = AVATAR_DIR / original_name
    suffix = 1
    while image_path.exists():
        image_path = AVATAR_DIR / f"{original_path.stem}_{suffix}{original_path.suffix}"
        suffix += 1
    try:
        image_path.write_bytes(image_data)
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Could not save profile picture") from exc

    avatar_url = f"/assets/avatars/{quote(image_path.name)}"
    previous_user = get_user_by_id(user_id)
    if not profile_sql.set_avatar_url(user_id, avatar_url):
        image_path.unlink(missing_ok=True)
        raise HTTPException(status_code=404, detail="Account not found")
    record_activity(
        user_id, "PROFILE_PICTURE_UPDATED", "Updated their profile picture.",
        target_type="account", target_id=user_id,
    )
    if previous_user and previous_user.avatar_url:
        previous_path = urlparse(previous_user.avatar_url).path
        if previous_path.startswith("/assets/avatars/"):
            previous_file = AVATAR_DIR / Path(unquote(previous_path)).name
            if previous_file != image_path:
                previous_file.unlink(missing_ok=True)
    return {"avatarUrl": avatar_url}


@router.post("/change-email")
def change_email(
    request: Request,
    response: Response,
    changeEmail: ChangeEmail
):
    try:
        validate_email(changeEmail.email, check_deliverability=False)
    except EmailNotValidError:
        raise HTTPException(status_code=400, detail="Invalid email format")
    if email_exists(changeEmail.email):
        raise HTTPException(status_code=409, detail="Email is already registered")

    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    message = profile_sql.change_email(user_id, changeEmail)

    if not message["success"]:
        raise HTTPException(status_code=400, detail=message["message"])

    record_activity(
        user_id, "EMAIL_CHANGED", "Changed their account email address.",
        target_type="account", target_id=user_id,
    )

    return {"success": True, "message": message["message"]}


@router.post("/change-name")
def change_name(request: Request, body: ChangeName):
    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = profile_sql.change_name(user_id, body)
    if not result["success"]:
        raise HTTPException(
            status_code=result.get("status_code", 400),
            detail=result["message"],
        )

    if result.get("changed"):
        record_activity(
            user_id,
            "PROFILE_NAME_CHANGED",
            "Updated their first and last name.",
            target_type="account",
            target_id=user_id,
        )

    return {
        "success": True,
        "message": result["message"],
        "nameChangeAvailableAt": result["available_at"],
    }


@router.post("/change-password")
def change_password(
    request: Request,
    response: Response,
    changePassword: ChangePassword
):
    user_id = get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if changePassword.newPassword != changePassword.confirmPassword:
        raise HTTPException(
            status_code=400,
            detail="New password and confirm password do not match",
        )

    message = profile_sql.change_password(user_id, changePassword)

    if not message["success"]:
        raise HTTPException(status_code=400, detail=message["message"])

    record_activity(
        user_id, "PASSWORD_CHANGED", "Changed their account password.",
        target_type="account", target_id=user_id,
    )

    return {"success": True, "message": message["message"]}
