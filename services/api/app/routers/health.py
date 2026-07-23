from fastapi import APIRouter
from redis.asyncio import Redis
from sqlalchemy import text

from ..config import get_settings
from ..database import SessionLocal
from ..storage import storage


router = APIRouter(tags=["system"])


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    checks: dict[str, str] = {}
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "unavailable"
    if settings.redis_url:
        try:
            client = Redis.from_url(settings.redis_url)
            await client.ping()
            await client.aclose()
            checks["redis"] = "ok"
        except Exception:
            checks["redis"] = "unavailable"
    else:
        checks["redis"] = "disabled"
    try:
        storage.ensure_ready()
        checks["object_storage"] = "ok"
    except Exception:
        checks["object_storage"] = "unavailable"
    healthy = checks["database"] == "ok" and checks["object_storage"] == "ok"
    return {"status": "ok" if healthy else "degraded", "service": "eccp-api", "checks": checks}
