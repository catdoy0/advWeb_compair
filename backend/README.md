## REQUIREMENTS

python 3.14.7

better if done in a python venv

```sh
pip install -r requirements

alembic upgrade head

uvicorn src.main:app --port 8080 --host 0.0.0.0
```

## Database snapshots

The administrator dashboard can create and download PostgreSQL custom-format snapshots using `pg_dump`. The backend stores them under `backend/assets/backups` with a SHA-256 checksum manifest. Restoring a snapshot is limited to super admins, validates the archive, and automatically creates a `pre_restore` snapshot first. `pg_restore` applies the archived objects and data in one transaction; on failure, the transaction rolls back and the service reapplies the safety snapshot. As with `pg_restore --clean`, objects that were created after the dump but are absent from its archive are not removed. A database dump also does not include uploaded avatar/receipt files or `store_settings.json`.

Install the PostgreSQL client tools on the backend host so `pg_dump` and `pg_restore` are available on `PATH` (for Debian/Ubuntu, install `postgresql-client`). Keep downloaded `.dump` files somewhere separate from the app host for an off-server copy. These are logical PostgreSQL database snapshots, not filesystem-level or Btrfs snapshots.

env
```sh
DATABASE_URL=

JWT_SECRET=

FORGET_PASS_EMAIL=
FORGET_PASS_EMAIL_APP_PASS=

GOOGLE_CLIENT_ID=

PRODUCTION=FALSE
```

## RUN TESTS

```sh
uv run pytest -sv test/
```

If you use a regular Python virtual environment instead, create and activate it, install the development requirements, then run pytest:

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m pytest -sv test/
```

To run one test file, provide its actual filename, for example `python -m pytest -sv test/test_auth_security.py`.

The auth tests use a temporary SQLite database, so they do not need the configured application database.
