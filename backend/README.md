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
```
