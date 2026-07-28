import asyncio
import json

from redis.asyncio import Redis

from .config import get_settings
from .database import SessionLocal
from .ingestion import process_document
from .routers.topic_discovery import run_due_rules
from .storage import storage


async def run_worker() -> None:
    settings = get_settings()
    if not settings.redis_url:
        raise RuntimeError("ECCP_API_REDIS_URL is required for the worker")
    storage.ensure_ready()
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    last_discovery_check = 0.0
    try:
        while True:
            item = await client.brpop(settings.redis_queue_name, timeout=5)
            if item:
                payload = json.loads(item[1])
                await process_document(payload["document_id"])
            loop_time = asyncio.get_running_loop().time()
            if loop_time - last_discovery_check >= settings.topic_discovery_poll_seconds:
                async with SessionLocal() as session:
                    await run_due_rules(session)
                last_discovery_check = loop_time
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(run_worker())
