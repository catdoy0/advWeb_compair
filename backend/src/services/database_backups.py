import hashlib
import json
import logging
import os
import re
import shutil
import subprocess
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.engine import make_url

from src.config import DATABASE_URL

logger = logging.getLogger(__name__)
BACKUP_DIRECTORY = Path(__file__).resolve().parents[2] / "assets" / "backups"
_BACKUP_LOCK = threading.Lock()
_SNAPSHOT_ID = re.compile(r"^[a-f0-9]{32}$")


class BackupManagerError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def _connection_environment() -> dict[str, str]:
    if not DATABASE_URL:
        raise BackupManagerError("Database backups are not configured.", 503)
    try:
        url = make_url(DATABASE_URL)
    except Exception as exc:
        raise BackupManagerError("The database connection settings are invalid.", 503) from exc
    if url.get_backend_name() != "postgresql":
        raise BackupManagerError("Snapshots currently require a PostgreSQL database.", 503)
    if not url.database:
        raise BackupManagerError("The database name is missing from the connection settings.", 503)

    env = os.environ.copy()
    env["PGDATABASE"] = url.database
    if url.host:
        env["PGHOST"] = url.host
    if url.port:
        env["PGPORT"] = str(url.port)
    if url.username:
        env["PGUSER"] = url.username
    if url.password:
        env["PGPASSWORD"] = url.password

    query = dict(url.query)
    for key in ("sslmode", "sslrootcert", "sslcert", "sslkey", "application_name", "connect_timeout"):
        if key in query:
            value = query[key]
            env_key = "PG" + key.upper()
            env[env_key] = str(value)
    return env


def _require_tool(name: str) -> str:
    executable = shutil.which(name)
    if executable is None:
        raise BackupManagerError(
            f"{name} is not installed on the backend server. Install the PostgreSQL client tools to use snapshots.",
            503,
        )
    return executable


def _ensure_directory() -> None:
    BACKUP_DIRECTORY.mkdir(mode=0o700, parents=True, exist_ok=True)
    try:
        BACKUP_DIRECTORY.chmod(0o700)
    except OSError:
        logger.warning("Could not restrict permissions on the database snapshot directory")


def _snapshot_paths(snapshot_id: str) -> tuple[Path, Path]:
    if not _SNAPSHOT_ID.fullmatch(snapshot_id):
        raise BackupManagerError("Snapshot not found.", 404)
    return (
        BACKUP_DIRECTORY / f"snapshot-{snapshot_id}.dump",
        BACKUP_DIRECTORY / f"snapshot-{snapshot_id}.json",
    )


def _digest(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _run(command: list[str], env: dict[str, str], timeout: int = 1800) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            command,
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise BackupManagerError("The database operation timed out. No snapshot was reported as complete.", 504) from exc
    except OSError as exc:
        raise BackupManagerError("Could not start the PostgreSQL client tool.", 503) from exc


def _create_snapshot_locked(
    label: str,
    kind: str,
    created_by: dict[str, Any] | None,
) -> dict[str, Any]:
    env = _connection_environment()
    pg_dump = _require_tool("pg_dump")
    _ensure_directory()
    snapshot_id = uuid.uuid4().hex
    dump_path, manifest_path = _snapshot_paths(snapshot_id)
    temporary_dump = dump_path.with_suffix(".dump.tmp")
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        result = _run(
            [pg_dump, "--format=custom", "--no-owner", "--no-privileges", "--file", str(temporary_dump)],
            env,
        )
        if result.returncode != 0:
            logger.error("pg_dump failed with exit code %s", result.returncode)
            raise BackupManagerError("PostgreSQL could not create the snapshot. Check the backend database connection.", 500)

        temporary_dump.chmod(0o600)
        os.replace(temporary_dump, dump_path)
        manifest = {
            "id": snapshot_id,
            "label": label,
            "kind": kind,
            "created_at": created_at,
            "created_by": created_by,
            "size_bytes": dump_path.stat().st_size,
            "sha256": _digest(dump_path),
            "format": "PostgreSQL custom dump",
        }
        temporary_manifest = manifest_path.with_suffix(".json.tmp")
        temporary_manifest.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        temporary_manifest.chmod(0o600)
        os.replace(temporary_manifest, manifest_path)
        return manifest
    except Exception:
        temporary_dump.unlink(missing_ok=True)
        manifest_path.with_suffix(".json.tmp").unlink(missing_ok=True)
        dump_path.unlink(missing_ok=True)
        manifest_path.unlink(missing_ok=True)
        raise


def create_snapshot(
    label: str,
    created_by: dict[str, Any] | None = None,
    *,
    kind: str = "manual",
) -> dict[str, Any]:
    if not _BACKUP_LOCK.acquire(blocking=False):
        raise BackupManagerError("Another snapshot or restore is already running. Try again shortly.", 409)
    try:
        return _create_snapshot_locked(label, kind, created_by)
    finally:
        _BACKUP_LOCK.release()


def list_snapshots() -> list[dict[str, Any]]:
    _ensure_directory()
    snapshots = []
    for manifest_path in BACKUP_DIRECTORY.glob("snapshot-*.json"):
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            if not isinstance(manifest, dict) or not isinstance(manifest.get("id"), str):
                continue
            snapshot_id = manifest.get("id")
            dump_path, expected_manifest = _snapshot_paths(snapshot_id) # type: ignore
            if expected_manifest != manifest_path or not dump_path.is_file():
                continue
            if not isinstance(manifest.get("created_at"), str):
                continue
            manifest["size_bytes"] = dump_path.stat().st_size
            snapshots.append(manifest)
        except (OSError, ValueError, TypeError, BackupManagerError):
            logger.warning("Skipping invalid database snapshot manifest %s", manifest_path.name)
    snapshots.sort(key=lambda item: item.get("created_at", ""), reverse=True)
    return snapshots


def get_snapshot_file(snapshot_id: str) -> tuple[Path, dict[str, Any]]:
    dump_path, manifest_path = _snapshot_paths(snapshot_id)
    if not dump_path.is_file() or not manifest_path.is_file():
        raise BackupManagerError("Snapshot not found.", 404)
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise BackupManagerError("Snapshot metadata is unreadable.", 409) from exc
    if not isinstance(manifest, dict):
        raise BackupManagerError("Snapshot metadata is unreadable.", 409)
    if manifest.get("id") != snapshot_id:
        raise BackupManagerError("Snapshot metadata does not match its file.", 409)
    return dump_path, manifest


def archive_snapshot(snapshot_id: str, archived_by: dict[str, Any] | None = None) -> dict[str, Any]:
    if not _BACKUP_LOCK.acquire(blocking=False):
        raise BackupManagerError("Another snapshot or restore is already running. Try again shortly.", 409)
    try:
        _dump_path, manifest = get_snapshot_file(snapshot_id)
        if manifest.get("archived_at"):
            raise BackupManagerError("Snapshot is already archived.", 409)

        _dump_path, manifest_path = _snapshot_paths(snapshot_id)
        manifest["archived_at"] = datetime.now(timezone.utc).isoformat()
        manifest["archived_by"] = archived_by
        temporary_manifest = manifest_path.with_suffix(".json.tmp")
        try:
            temporary_manifest.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
            temporary_manifest.chmod(0o600)
            os.replace(temporary_manifest, manifest_path)
        except OSError as exc:
            temporary_manifest.unlink(missing_ok=True)
            raise BackupManagerError("Could not archive the snapshot record.", 500) from exc
        return manifest
    finally:
        _BACKUP_LOCK.release()


def _restore_dump(path: Path, env: dict[str, str]) -> None:
    pg_restore = _require_tool("pg_restore")
    result = _run(
        [
            pg_restore,
            "--exit-on-error",
            "--single-transaction",
            "--clean",
            "--if-exists",
            "--no-owner",
            "--no-privileges",
            "--dbname", env["PGDATABASE"],
            str(path),
        ],
        env,
    )
    if result.returncode != 0:
        logger.error("pg_restore failed with exit code %s", result.returncode)
        raise BackupManagerError("PostgreSQL could not restore the snapshot.", 500)


def _validate_dump(path: Path, env: dict[str, str]) -> None:
    """Ask pg_restore to parse the archive before touching the live database."""
    pg_restore = _require_tool("pg_restore")
    result = _run([pg_restore, "--list", str(path)], env)
    if result.returncode != 0:
        logger.warning("pg_restore could not read snapshot archive (exit code %s)", result.returncode)
        raise BackupManagerError("Snapshot is not a readable PostgreSQL dump archive.", 409)


def restore_snapshot(snapshot_id: str, restored_by: dict[str, Any] | None = None) -> dict[str, Any]:
    if not _BACKUP_LOCK.acquire(blocking=False):
        raise BackupManagerError("Another snapshot or restore is already running. Try again shortly.", 409)
    try:
        selected_path, manifest = get_snapshot_file(snapshot_id)
        if manifest.get("sha256") != _digest(selected_path):
            raise BackupManagerError("Snapshot integrity check failed. The file may be damaged.", 409)

        env = _connection_environment()
        _validate_dump(selected_path, env)
        safety_snapshot = _create_snapshot_locked(
            f"Before restoring {manifest.get('label') or snapshot_id}",
            "pre_restore",
            restored_by,
        )
        try:
            _restore_dump(selected_path, env)
            _ensure_activity_table_after_restore()
        except Exception as restore_error:
            try:
                safety_path, _ = get_snapshot_file(safety_snapshot["id"])
                _restore_dump(safety_path, env)
                _ensure_activity_table_after_restore()
            except Exception:
                logger.exception("Automatic recovery from the pre-restore database snapshot also failed")
                raise BackupManagerError(
                    "Restore failed and automatic recovery also failed. The pre-restore snapshot is available in the snapshot list.",
                    500,
                ) from restore_error
            raise BackupManagerError(
                "Restore failed. The backend automatically reapplied its pre-restore snapshot.",
                500,
            ) from restore_error

        return {"snapshot": manifest, "safety_snapshot": safety_snapshot}
    finally:
        _BACKUP_LOCK.release()


def _ensure_activity_table_after_restore() -> None:
    from src.database import ensure_activity_log_table

    ensure_activity_log_table()
