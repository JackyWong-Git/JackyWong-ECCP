import json
import uuid
from datetime import datetime, timezone

from redis.asyncio import Redis

from .config import get_settings


async def enqueue_document(document_id: uuid.UUID) -> bool:
    settings = get_settings()
    if not settings.redis_url:
        return False
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        await client.lpush(settings.redis_queue_name, json.dumps({"document_id": str(document_id)}))
        return True
    finally:
        await client.aclose()


async def publish_workflow_event(
    *,
    event_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    from_status: str,
    to_status: str,
    actor_employee_id: str,
) -> bool:
    settings = get_settings()
    if not settings.redis_url:
        return False
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        await client.xadd(
            "eccp:workflow:events",
            {
                "event_id": str(event_id),
                "entity_type": entity_type,
                "entity_id": str(entity_id),
                "action": action,
                "from_status": from_status,
                "to_status": to_status,
                "actor_employee_id": actor_employee_id,
                "occurred_at": datetime.now(timezone.utc).isoformat(),
            },
            maxlen=10_000,
            approximate=True,
        )
        return True
    finally:
        await client.aclose()
