import io
import re
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..models import ContentTask, Material, Publication, PublicationMetric, Topic
from ..security import InternalUser, get_internal_user, require_permission
from ..storage import storage
from ..workflow_events import add_workflow_event, emit_workflow_event
from ..workflow_schemas import (
    ContentTaskCreate,
    ContentTaskItem,
    ContentTaskList,
    ContentTaskUpdate,
    DashboardMetric,
    DashboardSummary,
    MaterialCreate,
    MaterialItem,
    MaterialList,
    MaterialUpdate,
    MetricCreate,
    MetricItem,
    MetricUpdate,
    PublicationCreate,
    PublicationItem,
    PublicationList,
    PublicationUpdate,
    PublishTaskRequest,
    TaskTransition,
    TopicCreate,
    TopicItem,
    TopicList,
    TopicUpdate,
    WorkflowScheduleRequest,
    WorkflowScheduleResponse,
)


router = APIRouter(prefix="/v1", tags=["content-workflow"])
Session = Annotated[AsyncSession, Depends(get_session)]
User = Annotated[InternalUser, Depends(get_internal_user)]


async def _get_or_404(session: AsyncSession, model, entity_id: uuid.UUID, label: str):
    entity = await session.get(model, entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail=f"{label}不存在")
    return entity


async def _commit_with_event(session: AsyncSession, entity, event) -> None:
    await session.flush()
    await session.commit()
    await session.refresh(entity)
    await session.refresh(event)
    await emit_workflow_event(event)


def _safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^0-9A-Za-z._\-\u4e00-\u9fff]+", "-", filename).strip(".-")
    return cleaned[:180] or "material"


@router.get("/materials", response_model=MaterialList)
async def list_materials(
    session: Session,
    user: User,
    q: str = Query(default="", max_length=100),
    material_status: str = Query(default="", alias="status", max_length=24),
    department: str = Query(default="", max_length=160),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> MaterialList:
    require_permission(user, "accounts.manage_projects")
    filters = []
    if material_status:
        filters.append(Material.status == material_status)
    if department:
        filters.append(Material.source_department == department)
    if q:
        pattern = f"%{q}%"
        filters.append(or_(Material.title.ilike(pattern), Material.description.ilike(pattern)))
    total = await session.scalar(select(func.count()).select_from(Material).where(*filters)) or 0
    items = (
        await session.scalars(
            select(Material).where(*filters).order_by(Material.created_at.desc()).limit(limit).offset(offset)
        )
    ).all()
    return MaterialList(items=[MaterialItem.model_validate(item) for item in items], total=total)


@router.post("/materials", response_model=MaterialItem, status_code=status.HTTP_201_CREATED)
async def create_material(payload: MaterialCreate, session: Session, user: User) -> MaterialItem:
    require_permission(user, "accounts.manage_projects")
    material = Material(
        **payload.model_dump(),
        created_by_employee_id=user.employeeId,
        created_by_name=user.displayName,
    )
    session.add(material)
    await session.flush()
    event = add_workflow_event(
        session,
        entity_type="material",
        entity_id=material.id,
        action="material_submitted",
        user=user,
        to_status=material.status,
    )
    await _commit_with_event(session, material, event)
    return MaterialItem.model_validate(material)


@router.get("/materials/{material_id}", response_model=MaterialItem)
async def get_material(material_id: uuid.UUID, session: Session, user: User) -> MaterialItem:
    require_permission(user, "accounts.manage_projects")
    return MaterialItem.model_validate(await _get_or_404(session, Material, material_id, "素材"))


@router.patch("/materials/{material_id}", response_model=MaterialItem)
async def update_material(
    material_id: uuid.UUID,
    payload: MaterialUpdate,
    session: Session,
    user: User,
) -> MaterialItem:
    require_permission(user, "accounts.manage_projects")
    material = await _get_or_404(session, Material, material_id, "素材")
    previous_status = material.status
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(material, key, value)
    event = add_workflow_event(
        session,
        entity_type="material",
        entity_id=material.id,
        action="material_updated",
        user=user,
        from_status=previous_status,
        to_status=material.status,
    )
    await _commit_with_event(session, material, event)
    return MaterialItem.model_validate(material)


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(material_id: uuid.UUID, session: Session, user: User) -> None:
    require_permission(user, "accounts.manage_projects")
    material = await _get_or_404(session, Material, material_id, "素材")
    object_key = material.object_key
    await session.delete(material)
    await session.commit()
    if object_key:
        storage.delete(object_key)


@router.post("/materials/{material_id}/attachment", response_model=MaterialItem)
async def upload_material_attachment(
    material_id: uuid.UUID,
    session: Session,
    user: User,
    file: Annotated[UploadFile, File()],
) -> MaterialItem:
    require_permission(user, "accounts.manage_projects")
    settings = get_settings()
    material = await _get_or_404(session, Material, material_id, "素材")
    contents = await file.read(settings.max_upload_bytes + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="不能上传空文件")
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="文件超过上传大小限制")
    filename = _safe_filename(file.filename or "material")
    object_key = f"materials/{material.id}/{uuid.uuid4()}/{filename}"
    storage.put(object_key, io.BytesIO(contents), file.content_type or "application/octet-stream")
    previous_key = material.object_key
    material.object_key = object_key
    material.original_filename = filename
    material.content_type = file.content_type or "application/octet-stream"
    material.size_bytes = len(contents)
    event = add_workflow_event(
        session,
        entity_type="material",
        entity_id=material.id,
        action="material_attachment_uploaded",
        user=user,
        metadata={"filename": filename, "size_bytes": len(contents)},
    )
    await _commit_with_event(session, material, event)
    if previous_key:
        storage.delete(previous_key)
    return MaterialItem.model_validate(material)


@router.get("/topics", response_model=TopicList)
async def list_topics(
    session: Session,
    user: User,
    q: str = Query(default="", max_length=100),
    topic_status: str = Query(default="", alias="status", max_length=24),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> TopicList:
    require_permission(user, "accounts.view_topics")
    filters = []
    if topic_status:
        filters.append(Topic.status == topic_status)
    if q:
        pattern = f"%{q}%"
        filters.append(or_(Topic.title.ilike(pattern), Topic.description.ilike(pattern)))
    total = await session.scalar(select(func.count()).select_from(Topic).where(*filters)) or 0
    items = (
        await session.scalars(select(Topic).where(*filters).order_by(Topic.created_at.desc()).limit(limit).offset(offset))
    ).all()
    return TopicList(items=[TopicItem.model_validate(item) for item in items], total=total)


@router.post("/topics", response_model=TopicItem, status_code=status.HTTP_201_CREATED)
async def create_topic(payload: TopicCreate, session: Session, user: User) -> TopicItem:
    require_permission(user, "accounts.create_content")
    if payload.material_id:
        await _get_or_404(session, Material, payload.material_id, "素材")
    topic = Topic(
        **payload.model_dump(),
        created_by_employee_id=user.employeeId,
        created_by_name=user.displayName,
    )
    session.add(topic)
    await session.flush()
    event = add_workflow_event(
        session,
        entity_type="topic",
        entity_id=topic.id,
        action="topic_created",
        user=user,
        to_status=topic.status,
    )
    await _commit_with_event(session, topic, event)
    return TopicItem.model_validate(topic)


@router.get("/topics/{topic_id}", response_model=TopicItem)
async def get_topic(topic_id: uuid.UUID, session: Session, user: User) -> TopicItem:
    require_permission(user, "accounts.view_topics")
    return TopicItem.model_validate(await _get_or_404(session, Topic, topic_id, "选题"))


@router.patch("/topics/{topic_id}", response_model=TopicItem)
async def update_topic(topic_id: uuid.UUID, payload: TopicUpdate, session: Session, user: User) -> TopicItem:
    require_permission(user, "accounts.create_content")
    topic = await _get_or_404(session, Topic, topic_id, "选题")
    previous_status = topic.status
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(topic, key, value)
    event = add_workflow_event(
        session,
        entity_type="topic",
        entity_id=topic.id,
        action="topic_updated",
        user=user,
        from_status=previous_status,
        to_status=topic.status,
    )
    await _commit_with_event(session, topic, event)
    return TopicItem.model_validate(topic)


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(topic_id: uuid.UUID, session: Session, user: User) -> None:
    require_permission(user, "accounts.create_content")
    topic = await _get_or_404(session, Topic, topic_id, "选题")
    await session.delete(topic)
    await session.commit()


@router.get("/content-tasks", response_model=ContentTaskList)
async def list_content_tasks(
    session: Session,
    user: User,
    q: str = Query(default="", max_length=100),
    task_status: str = Query(default="", alias="status", max_length=24),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ContentTaskList:
    require_permission(user, "accounts.view_tasks")
    filters = []
    if task_status:
        filters.append(ContentTask.status == task_status)
    if q:
        pattern = f"%{q}%"
        filters.append(or_(ContentTask.title.ilike(pattern), ContentTask.description.ilike(pattern)))
    total = await session.scalar(select(func.count()).select_from(ContentTask).where(*filters)) or 0
    items = (
        await session.scalars(
            select(ContentTask).where(*filters).order_by(ContentTask.created_at.desc()).limit(limit).offset(offset)
        )
    ).all()
    return ContentTaskList(items=[ContentTaskItem.model_validate(item) for item in items], total=total)


@router.post("/content-tasks", response_model=ContentTaskItem, status_code=status.HTTP_201_CREATED)
async def create_content_task(payload: ContentTaskCreate, session: Session, user: User) -> ContentTaskItem:
    require_permission(user, "accounts.manage_projects")
    if payload.topic_id:
        await _get_or_404(session, Topic, payload.topic_id, "选题")
    if payload.material_id:
        await _get_or_404(session, Material, payload.material_id, "素材")
    task = ContentTask(
        **payload.model_dump(),
        created_by_employee_id=user.employeeId,
        created_by_name=user.displayName,
    )
    session.add(task)
    await session.flush()
    event = add_workflow_event(
        session,
        entity_type="content_task",
        entity_id=task.id,
        action="task_created",
        user=user,
        to_status=task.status,
    )
    await _commit_with_event(session, task, event)
    return ContentTaskItem.model_validate(task)


@router.get("/content-tasks/{task_id}", response_model=ContentTaskItem)
async def get_content_task(task_id: uuid.UUID, session: Session, user: User) -> ContentTaskItem:
    require_permission(user, "accounts.view_tasks")
    return ContentTaskItem.model_validate(await _get_or_404(session, ContentTask, task_id, "内容任务"))


@router.patch("/content-tasks/{task_id}", response_model=ContentTaskItem)
async def update_content_task(
    task_id: uuid.UUID,
    payload: ContentTaskUpdate,
    session: Session,
    user: User,
) -> ContentTaskItem:
    require_permission(user, "accounts.manage_projects")
    task = await _get_or_404(session, ContentTask, task_id, "内容任务")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    task.version += 1
    event = add_workflow_event(
        session,
        entity_type="content_task",
        entity_id=task.id,
        action="task_updated",
        user=user,
        from_status=task.status,
        to_status=task.status,
    )
    await _commit_with_event(session, task, event)
    return ContentTaskItem.model_validate(task)


@router.delete("/content-tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content_task(task_id: uuid.UUID, session: Session, user: User) -> None:
    require_permission(user, "accounts.manage_projects")
    task = await _get_or_404(session, ContentTask, task_id, "内容任务")
    await session.delete(task)
    await session.commit()


TASK_TRANSITIONS = {
    "todo": {"doing", "cancelled"},
    "doing": {"review", "cancelled"},
    "review": {"approved", "doing", "cancelled"},
    "approved": {"published", "doing", "cancelled"},
    "published": set(),
    "cancelled": {"todo"},
}


@router.post("/content-tasks/{task_id}/transition", response_model=ContentTaskItem)
async def transition_content_task(
    task_id: uuid.UUID,
    payload: TaskTransition,
    session: Session,
    user: User,
) -> ContentTaskItem:
    require_permission(user, "accounts.manage_projects")
    task = await _get_or_404(session, ContentTask, task_id, "内容任务")
    if payload.status not in TASK_TRANSITIONS.get(task.status, set()):
        raise HTTPException(status_code=409, detail=f"任务不能从 {task.status} 变更为 {payload.status}")
    previous_status = task.status
    task.status = payload.status
    task.version += 1
    event = add_workflow_event(
        session,
        entity_type="content_task",
        entity_id=task.id,
        action="task_status_changed",
        user=user,
        from_status=previous_status,
        to_status=task.status,
        metadata={"note": payload.note},
    )
    await _commit_with_event(session, task, event)
    return ContentTaskItem.model_validate(task)


@router.get("/publications", response_model=PublicationList)
async def list_publications(
    session: Session,
    user: User,
    publication_status: str = Query(default="", alias="status", max_length=24),
    channel: str = Query(default="", max_length=80),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> PublicationList:
    require_permission(user, "accounts.view_analytics")
    filters = []
    if publication_status:
        filters.append(Publication.status == publication_status)
    if channel:
        filters.append(Publication.channel == channel)
    total = await session.scalar(select(func.count()).select_from(Publication).where(*filters)) or 0
    items = (
        await session.scalars(
            select(Publication).where(*filters).order_by(Publication.created_at.desc()).limit(limit).offset(offset)
        )
    ).all()
    return PublicationList(items=[PublicationItem.model_validate(item) for item in items], total=total)


@router.post("/publications", response_model=PublicationItem, status_code=status.HTTP_201_CREATED)
async def create_publication(payload: PublicationCreate, session: Session, user: User) -> PublicationItem:
    require_permission(user, "accounts.create_content")
    await _get_or_404(session, ContentTask, payload.task_id, "内容任务")
    publication = Publication(
        **payload.model_dump(),
        created_by_employee_id=user.employeeId,
        publisher_employee_id=user.employeeId if payload.status == "published" else "",
        publisher_name=user.displayName if payload.status == "published" else "",
    )
    session.add(publication)
    await session.flush()
    event = add_workflow_event(
        session,
        entity_type="publication",
        entity_id=publication.id,
        action="publication_created",
        user=user,
        to_status=publication.status,
    )
    await _commit_with_event(session, publication, event)
    return PublicationItem.model_validate(publication)


@router.get("/publications/{publication_id}", response_model=PublicationItem)
async def get_publication(publication_id: uuid.UUID, session: Session, user: User) -> PublicationItem:
    require_permission(user, "accounts.view_analytics")
    return PublicationItem.model_validate(await _get_or_404(session, Publication, publication_id, "发布记录"))


@router.patch("/publications/{publication_id}", response_model=PublicationItem)
async def update_publication(
    publication_id: uuid.UUID,
    payload: PublicationUpdate,
    session: Session,
    user: User,
) -> PublicationItem:
    require_permission(user, "accounts.create_content")
    publication = await _get_or_404(session, Publication, publication_id, "发布记录")
    previous_status = publication.status
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(publication, key, value)
    event = add_workflow_event(
        session,
        entity_type="publication",
        entity_id=publication.id,
        action="publication_updated",
        user=user,
        from_status=previous_status,
        to_status=publication.status,
    )
    await _commit_with_event(session, publication, event)
    return PublicationItem.model_validate(publication)


@router.delete("/publications/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_publication(publication_id: uuid.UUID, session: Session, user: User) -> None:
    require_permission(user, "accounts.create_content")
    publication = await _get_or_404(session, Publication, publication_id, "发布记录")
    await session.delete(publication)
    await session.commit()


@router.get("/publications/{publication_id}/metrics", response_model=MetricItem)
async def get_publication_metrics(publication_id: uuid.UUID, session: Session, user: User) -> MetricItem:
    require_permission(user, "accounts.view_analytics")
    metric = await session.scalar(select(PublicationMetric).where(PublicationMetric.publication_id == publication_id))
    if not metric:
        raise HTTPException(status_code=404, detail="发布数据尚未回流")
    return MetricItem.model_validate(metric)


@router.put("/publications/{publication_id}/metrics", response_model=MetricItem)
async def upsert_publication_metrics(
    publication_id: uuid.UUID,
    payload: MetricCreate,
    session: Session,
    user: User,
) -> MetricItem:
    require_permission(user, "accounts.create_content")
    await _get_or_404(session, Publication, publication_id, "发布记录")
    metric = await session.scalar(select(PublicationMetric).where(PublicationMetric.publication_id == publication_id))
    if metric:
        for key, value in payload.model_dump().items():
            setattr(metric, key, value)
        metric.captured_at = datetime.now(timezone.utc)
        action = "feedback_updated"
    else:
        metric = PublicationMetric(publication_id=publication_id, **payload.model_dump())
        session.add(metric)
        action = "feedback_recorded"
    await session.flush()
    event = add_workflow_event(
        session,
        entity_type="publication",
        entity_id=publication_id,
        action=action,
        user=user,
        metadata={"views": metric.views, "likes": metric.likes, "shares": metric.shares},
    )
    await _commit_with_event(session, metric, event)
    return MetricItem.model_validate(metric)


@router.patch("/publication-metrics/{metric_id}", response_model=MetricItem)
async def update_metric(metric_id: uuid.UUID, payload: MetricUpdate, session: Session, user: User) -> MetricItem:
    require_permission(user, "accounts.create_content")
    metric = await _get_or_404(session, PublicationMetric, metric_id, "回流数据")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(metric, key, value)
    metric.captured_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(metric)
    return MetricItem.model_validate(metric)


@router.delete("/publication-metrics/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_metric(metric_id: uuid.UUID, session: Session, user: User) -> None:
    require_permission(user, "accounts.create_content")
    metric = await _get_or_404(session, PublicationMetric, metric_id, "回流数据")
    await session.delete(metric)
    await session.commit()


@router.post("/workflow/materials/{material_id}/schedule", response_model=WorkflowScheduleResponse)
async def schedule_material(
    material_id: uuid.UUID,
    payload: WorkflowScheduleRequest,
    session: Session,
    user: User,
) -> WorkflowScheduleResponse:
    require_permission(user, "accounts.manage_projects")
    material = await _get_or_404(session, Material, material_id, "素材")
    if material.status in {"published", "rejected"}:
        raise HTTPException(status_code=409, detail="当前素材状态不能进入内容调度")
    previous_status = material.status
    material.status = "in_progress"
    material.assignee_name = payload.owner_name or user.displayName
    topic = None
    if payload.create_topic:
        topic = Topic(
            material_id=material.id,
            title=payload.topic_title.strip() or material.title,
            description=material.description,
            status="in_progress",
            priority=payload.priority,
            assignee_employee_id=payload.owner_employee_id or user.employeeId,
            assignee_name=payload.owner_name or user.displayName,
            tags=material.tags,
            source=f"素材报送 · {material.source_department}",
            channel=material.expected_channels[0] if material.expected_channels else "全渠道",
            created_by_employee_id=user.employeeId,
            created_by_name=user.displayName,
        )
        session.add(topic)
        await session.flush()
    task = ContentTask(
        topic_id=topic.id if topic else None,
        material_id=material.id,
        title=f"制作：{material.title}",
        description=material.description,
        project_name=payload.project_name,
        status="todo",
        priority=payload.priority,
        owner_employee_id=payload.owner_employee_id or user.employeeId,
        owner_name=payload.owner_name or user.displayName,
        due_at=payload.due_at,
        created_by_employee_id=user.employeeId,
        created_by_name=user.displayName,
    )
    session.add(task)
    await session.flush()
    event = add_workflow_event(
        session,
        entity_type="material",
        entity_id=material.id,
        action="material_scheduled",
        user=user,
        from_status=previous_status,
        to_status=material.status,
        metadata={"topic_id": str(topic.id) if topic else "", "task_id": str(task.id)},
    )
    await session.flush()
    await session.commit()
    await session.refresh(material)
    if topic:
        await session.refresh(topic)
    await session.refresh(task)
    await session.refresh(event)
    await emit_workflow_event(event)
    return WorkflowScheduleResponse(
        material=MaterialItem.model_validate(material),
        topic=TopicItem.model_validate(topic) if topic else None,
        task=ContentTaskItem.model_validate(task),
    )


@router.post("/workflow/content-tasks/{task_id}/publish", response_model=PublicationItem)
async def publish_content_task(
    task_id: uuid.UUID,
    payload: PublishTaskRequest,
    session: Session,
    user: User,
) -> PublicationItem:
    require_permission(user, "accounts.create_content")
    task = await _get_or_404(session, ContentTask, task_id, "内容任务")
    if task.status != "approved":
        raise HTTPException(status_code=409, detail="内容任务必须审核通过后才能发布")
    publication = Publication(
        task_id=task.id,
        title=payload.title.strip() or task.title.removeprefix("制作："),
        channel=payload.channel,
        status="published",
        external_url=payload.external_url,
        published_at=datetime.now(timezone.utc),
        reviewer_employee_id=user.employeeId,
        reviewer_name=user.displayName,
        publisher_employee_id=user.employeeId,
        publisher_name=user.displayName,
        created_by_employee_id=user.employeeId,
    )
    session.add(publication)
    task.status = "published"
    task.version += 1
    if task.material_id:
        material = await session.get(Material, task.material_id)
        if material:
            material.status = "published"
            material.selected_channels = list(dict.fromkeys([*material.selected_channels, payload.channel]))
    if task.topic_id:
        topic = await session.get(Topic, task.topic_id)
        if topic:
            topic.status = "done"
    await session.flush()
    event = add_workflow_event(
        session,
        entity_type="publication",
        entity_id=publication.id,
        action="content_published",
        user=user,
        from_status="approved",
        to_status="published",
        metadata={"task_id": str(task.id), "channel": payload.channel},
    )
    await _commit_with_event(session, publication, event)
    return PublicationItem.model_validate(publication)


@router.get("/analytics/dashboard", response_model=DashboardSummary)
async def analytics_dashboard(session: Session, user: User) -> DashboardSummary:
    require_permission(user, "accounts.view_analytics")
    rows = (
        await session.execute(
            select(Publication, PublicationMetric)
            .outerjoin(PublicationMetric, PublicationMetric.publication_id == Publication.id)
            .where(Publication.status == "published")
            .order_by(Publication.published_at.desc())
        )
    ).all()
    items: list[DashboardMetric] = []
    channel_totals: dict[str, int] = {}
    for publication, metric in rows:
        views = metric.views if metric else 0
        channel_totals[publication.channel] = channel_totals.get(publication.channel, 0) + views
        items.append(
            DashboardMetric(
                publication_id=publication.id,
                title=publication.title,
                channel=publication.channel,
                published_at=publication.published_at,
                views=views,
                likes=metric.likes if metric else 0,
                comments=metric.comments if metric else 0,
                shares=metric.shares if metric else 0,
                favorites=metric.favorites if metric else 0,
                conversions=metric.conversions if metric else 0,
                completion_rate=metric.completion_rate if metric else 0,
            )
        )
    return DashboardSummary(
        total_views=sum(item.views for item in items),
        total_publications=len(items),
        total_engagements=sum(item.likes + item.comments + item.shares + item.favorites for item in items),
        total_conversions=sum(item.conversions for item in items),
        channel_totals=channel_totals,
        items=items,
    )
