import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=1000)


class KnowledgeBaseItem(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    document_count: int
    chunk_count: int
    embedding_model: str
    status: str
    size_bytes: int
    updated_at: datetime


class KnowledgeBaseList(BaseModel):
    items: list[KnowledgeBaseItem]


class DocumentItem(BaseModel):
    id: uuid.UUID
    knowledge_base_id: uuid.UUID
    name: str
    content_type: str
    size_bytes: int
    status: str
    chunk_count: int
    error_message: str
    concept_id: str
    document_metadata: dict
    created_at: datetime


class DocumentList(BaseModel):
    items: list[DocumentItem]


class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=2000)
    top_k: int = Field(default=8, ge=1, le=30)


class SearchResult(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_name: str
    content: str
    score: float
    ordinal: int


class SearchResponse(BaseModel):
    query: str
    items: list[SearchResult]


class OkfConcept(BaseModel):
    id: str
    title: str
    type: str
    description: str
    tags: list[str]
    trust: str
    status: str
    links: list[str]
    document_id: uuid.UUID


class OkfGraph(BaseModel):
    okf_version: str
    concepts: list[OkfConcept]
    edges: list[dict[str, str]]
    trust_counts: dict[str, int]
