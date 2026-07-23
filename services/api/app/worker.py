import asyncio
import json

from redis.asyncio import Redis

from .config import get_settings
from .ingestion import process_document
from .storage import storage


async def run_worker() -> None:
    settings = get_settings()
    if not settings.redis_url:
        raise RuntimeError("ECCP_API_REDIS_URL is required for the worker")
    storage.ensure_ready()
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        while True:
            item = await client.brpop(settings.redis_queue_name, timeout=5)
            if not item:
                continue
            payload = json.loads(item[1])
            await process_document(payload["document_id"])
    finally:
        await client.aclose()


if __name__ == "__main__":
    asyncio.run(run_worker())
