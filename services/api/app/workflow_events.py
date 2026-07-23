import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from .models import WorkflowEvent
from .queue import publish_workflow_event
from .security import InternalUser


def add_workflow_event(
    session: AsyncSession,
    *,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    user: InternalUser,
    from_status: str = "",
    to_status: str = "",
    metadata: dict | None = None,
) -> WorkflowEvent:
    event = WorkflowEvent(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        from_status=from_status,
        to_status=to_status,
        actor_employee_id=user.employeeId,
        actor_name=user.displayName,
        event_metadata=metadata or {},
    )
    session.add(event)
    return event


async def emit_workflow_event(event: WorkflowEvent) -> None:
    await publish_workflow_event(
        event_id=event.id,
        entity_type=event.entity_type,
        entity_id=event.entity_id,
        action=event.action,
        from_status=event.from_status,
        to_status=event.to_status,
        actor_employee_id=event.actor_employee_id,
    )
