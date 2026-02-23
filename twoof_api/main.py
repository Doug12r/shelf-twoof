import logging
import subprocess
import sys
import json
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from pathlib import Path

from .config import settings
from .database import engine


# ── Logging ───────────────────────────────────────────────────────────

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps({
            "ts": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        })


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JSONFormatter())
logging.root.handlers = [handler]
logging.root.setLevel(settings.log_level.upper())
logger = logging.getLogger("twoof")


# ── Startup helpers ───────────────────────────────────────────────────

async def wait_for_db(retries: int = 15, delay: float = 2.0):
    import asyncio
    for attempt in range(1, retries + 1):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info("DB connected")
            return
        except Exception:
            logger.warning(f"DB not ready, retrying in {delay}s... ({attempt}/{retries})")
            await asyncio.sleep(delay)
    raise RuntimeError("Could not connect to database")


async def ensure_schema():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS twoof"))


def run_migrations():
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        logger.error(f"Migration failed: {result.stderr}")
        raise RuntimeError(f"Alembic migration failed: {result.stderr}")
    logger.info("Migrations applied")


# ── Lifespan ──────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TwoOf starting up")
    await wait_for_db()
    await ensure_schema()
    run_migrations()

    # Ensure photos directory exists
    photos_dir = Path(settings.data_dir) / "photos"
    photos_dir.mkdir(parents=True, exist_ok=True)

    logger.info("TwoOf ready")
    yield
    logger.info("TwoOf shutting down")


# ── App ───────────────────────────────────────────────────────────────

app = FastAPI(title="TwoOf", version="1.0.0", lifespan=lifespan)

# Routes
from .routes.household import router as household_router
from .routes.memories import router as memories_router
from .routes.photos import router as photos_router
from .routes.dates import router as dates_router
from .routes.milestones import router as milestones_router
from .routes.search import router as search_router
from .routes.export import router as export_router

app.include_router(household_router)
app.include_router(memories_router)
app.include_router(photos_router)
app.include_router(dates_router)
app.include_router(milestones_router)
app.include_router(search_router)
app.include_router(export_router)


# ── Health ────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    db_ok = False
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    return JSONResponse(
        status_code=200 if db_ok else 503,
        content={"status": "ok" if db_ok else "degraded", "db": db_ok, "app": "twoof", "version": "1.0.0"},
    )


# ── Error handlers ────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def global_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc} | {request.method} {request.url.path}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Static files ──────────────────────────────────────────────────────

static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
