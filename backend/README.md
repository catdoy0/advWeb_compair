## REQUIREMENTS

python 3.14.7

better if done in a python venv

```sh
pip install -r requirements

alembic upgrade head

uvicorn src.main:app --port 8080 --host 0.0.0.0
```

env
```sh
DATABASE_URL=

JWT_SECRET=

FORGET_PASS_EMAIL=
FORGET_PASS_EMAIL_APP_PASS=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

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
