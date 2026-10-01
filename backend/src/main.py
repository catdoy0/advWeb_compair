from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from src.config import validate_config
from src.database import assert_database_ready, ensure_default_super_admin
from src.routes.auth import router as authRouter


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_config()
    if not assert_database_ready():
        return
    ensure_default_super_admin()
    print(f"""
        {app.title}
            """)
    yield
    print("closing...")


app = FastAPI(lifespan=lifespan)
app.title = "compair backend"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authRouter, prefix="/auth")


@app.get("/")
def root():
    return JSONResponse(status_code=200, content={"message" : "🗿"}) 
