from contextlib import asynccontextmanager

from fastapi import FastAPI

from .config import get_settings
from .database import create_schema
from .routers.health import router as health_router
from .routers.knowledge import router as knowledge_router
from .routers.skills import router as skills_router
from .routers.workflow import router as workflow_router
from .storage import storage


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    if settings.auto_create_schema:
        await create_schema()
    storage.ensure_ready()
    yield


app = FastAPI(
    title="ECCP Business API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)
app.include_router(health_router)
app.include_router(knowledge_router)
app.include_router(workflow_router)
app.include_router(skills_router)
