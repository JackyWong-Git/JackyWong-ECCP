import io
import math
import re
import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..database import get_session
from ..embeddings import embed_texts
from ..ingestion import process_document
from ..models import Document, DocumentChunk, KnowledgeBase
from ..queue import enqueue_document
from ..schemas import (
    DocumentItem,
    DocumentList,
    KnowledgeBaseCreate,
    KnowledgeBaseItem,
    KnowledgeBaseList,
    SearchRequest,
    SearchResponse,
    SearchResult,
)
from ..security import InternalUser, get_internal_user, require_permission
from ..storage import storage


router = APIRouter(prefix="/v1/knowledge-bases", tags=["knowledge"])
Session = Annotated[AsyncSession, Depends(get_session)]
User = Annotated[InternalUser, Depends(get_internal_user)]


def _safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^0-9A-Za-z._\-\u4e00-\u9fff]+", "-", filename).strip(".-")
    return cleaned[:180] or "document"


@router.get("", response_model=KnowledgeBaseList)
async def list_knowledge_bases(session: Session, user: User) -> KnowledgeBaseList:
    require_permission(user, "accounts.view_knowledge")
    stats = (
        select(
            Document.knowledge_base_id.label("knowledge_base_id"),
            func.count(Document.id).label("document_count"),
            func.coalesce(func.sum(Document.chunk_count), 0).label("chunk_count"),
            func.coalesce(func.sum(Document.size_bytes), 0).label("size_bytes"),
        )
        .group_by(Document.knowledge_base_id)
        .subquery()
    )
    rows = (
        await session.execute(
            select(
                KnowledgeBase,
                stats.c.document_count,
                stats.c.chunk_count,
                stats.c.size_bytes,
            )
            .outerjoin(stats, KnowledgeBase.id == stats.c.knowledge_base_id)
            .order_by(KnowledgeBase.updated_at.desc())
        )
    ).all()
    return KnowledgeBaseList(
        items=[
            KnowledgeBaseItem(
                id=knowledge_base.id,
                name=knowledge_base.name,
                description=knowledge_base.description,
                document_count=document_count or 0,
                chunk_count=chunk_count or 0,
                embedding_model=knowledge_base.embedding_model,
                status=knowledge_base.status,
                size_bytes=size_bytes or 0,
                updated_at=knowledge_base.updated_at,
            )
            for knowledge_base, document_count, chunk_count, size_bytes in rows
        ]
    )


@router.post("", response_model=KnowledgeBaseItem, status_code=status.HTTP_201_CREATED)
async def create_knowledge_base(payload: KnowledgeBaseCreate, session: Session, user: User) -> KnowledgeBaseItem:
    require_permission(user, "accounts.create_content")
    settings = get_settings()
    knowledge_base = KnowledgeBase(
        name=payload.name.strip(),
        description=payload.description.strip(),
        embedding_model=settings.embedding_model if settings.embedding_provider != "local_hash" else "local-hash-1536",
        created_by_employee_id=user.employeeId,
    )
    session.add(knowledge_base)
    await session.commit()
    await session.refresh(knowledge_base)
    return KnowledgeBaseItem(
        id=knowledge_base.id,
        name=knowledge_base.name,
        description=knowledge_base.description,
        document_count=0,
        chunk_count=0,
        embedding_model=knowledge_base.embedding_model,
        status=knowledge_base.status,
        size_bytes=0,
        updated_at=knowledge_base.updated_at,
    )


@router.get("/{knowledge_base_id}/documents", response_model=DocumentList)
async def list_documents(knowledge_base_id: uuid.UUID, session: Session, user: User) -> DocumentList:
    require_permission(user, "accounts.view_knowledge")
    documents = (
        await session.scalars(
            select(Document)
            .where(Document.knowledge_base_id == knowledge_base_id)
            .order_by(Document.created_at.desc())
        )
    ).all()
    return DocumentList(items=[DocumentItem.model_validate(document, from_attributes=True) for document in documents])


@router.post("/{knowledge_base_id}/documents", response_model=DocumentItem, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    knowledge_base_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    session: Session,
    user: User,
    file: Annotated[UploadFile, File()],
) -> DocumentItem:
    require_permission(user, "accounts.create_content")
    settings = get_settings()
    knowledge_base = await session.get(KnowledgeBase, knowledge_base_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="知识库不存在")
    contents = await file.read(settings.max_upload_bytes + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="不能上传空文件")
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="文件超过上传大小限制")
    document_id = uuid.uuid4()
    filename = _safe_filename(file.filename or "document")
    object_key = f"knowledge-bases/{knowledge_base_id}/documents/{document_id}/{filename}"
    storage.put(object_key, io.BytesIO(contents), file.content_type or "application/octet-stream")
    document = Document(
        id=document_id,
        knowledge_base_id=knowledge_base_id,
        name=filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(contents),
        object_key=object_key,
        created_by_employee_id=user.employeeId,
    )
    session.add(document)
    await session.commit()
    await session.refresh(document)
    queued = await enqueue_document(document.id)
    if not queued:
        background_tasks.add_task(process_document, document.id)
    return DocumentItem.model_validate(document, from_attributes=True)


@router.post("/{knowledge_base_id}/search", response_model=SearchResponse)
async def semantic_search(
    knowledge_base_id: uuid.UUID,
    payload: SearchRequest,
    session: Session,
    user: User,
) -> SearchResponse:
    require_permission(user, "accounts.view_knowledge")
    query_vector = (await embed_texts([payload.query]))[0]
    settings = get_settings()
    if settings.is_sqlite:
        rows = (
            await session.execute(
                select(DocumentChunk, Document.name)
                .join(Document, Document.id == DocumentChunk.document_id)
                .where(DocumentChunk.knowledge_base_id == knowledge_base_id)
            )
        ).all()

        def cosine(embedding: list[float]) -> float:
            denominator = math.sqrt(sum(value * value for value in embedding)) or 1.0
            return sum(left * right for left, right in zip(query_vector, embedding, strict=True)) / denominator

        ranked = sorted(
            ((chunk, name, cosine(chunk.embedding)) for chunk, name in rows),
            key=lambda item: item[2],
            reverse=True,
        )[: payload.top_k]
    else:
        distance = DocumentChunk.embedding.cosine_distance(query_vector)
        rows = (
            await session.execute(
                select(DocumentChunk, Document.name, (1 - distance).label("score"))
                .join(Document, Document.id == DocumentChunk.document_id)
                .where(DocumentChunk.knowledge_base_id == knowledge_base_id)
                .order_by(distance)
                .limit(payload.top_k)
            )
        ).all()
        ranked = [(chunk, name, float(score)) for chunk, name, score in rows]
    return SearchResponse(
        query=payload.query,
        items=[
            SearchResult(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_name=name,
                content=chunk.content,
                score=max(0.0, min(1.0, score)),
                ordinal=chunk.ordinal,
            )
            for chunk, name, score in ranked
        ],
    )
