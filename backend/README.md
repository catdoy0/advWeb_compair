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
JWT_ALGORITHM=
```
