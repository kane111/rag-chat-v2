from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Literal
from enum import Enum

from pydantic import BaseModel, Field


class ChunkingMethod(str, Enum):
    """Available text splitting methods from LangChain"""
    RECURSIVE_CHARACTER = "recursive_character"  # Default, best for most cases
    CHARACTER = "character"  # Simple character-based splitting
    TOKEN = "token"  # Token-based (tiktoken)
    MARKDOWN_HEADER = "markdown_header"  # Markdown header-aware
    NLTK = "nltk"  # Sentence-based (NLTK)
    SPACY = "spacy"  # Sentence-based (spaCy)


class FileMeta(BaseModel):
    id: int
    filename: str
    filepath: str
    filetype: str
    size_mb: float
    uploaded_at: datetime
    updated_at: datetime
    converted_with_docling: bool = False
    raw_markdown: str | None = None

    class Config:
        from_attributes = True


class ChunkOut(BaseModel):
    id: int
    file_id: int
    chunk_index: int
    content: str
    section_heading: Optional[str]
    page_number: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class IngestResponse(BaseModel):
    file: FileMeta
    chunks: int
    raw_markdown: str | None = None


class CitationInfo(BaseModel):
    doc_id: str
    page: Optional[int]
    section: Optional[str]


class ContextChunk(BaseModel):
    chunk: str
    citation: CitationInfo


class QueryResponse(BaseModel):
    answer: str
    context: List[ContextChunk]


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)
    stream: bool = False


class StatsResponse(BaseModel):
    files: int
    chunks: int


# Suggested questions flow removed from API


class ProviderInfo(BaseModel):
    key: str
    label: str
    type: Literal["llm", "embedding"]


class ProviderListResponse(BaseModel):
    providers: List[ProviderInfo]


class ProviderModel(BaseModel):
    id: str
    label: str
    context_length: Optional[int] = None


class ProviderModelsResponse(BaseModel):
    provider: str
    type: Literal["llm", "embedding"]
    models: List[ProviderModel]


class ProviderSelection(BaseModel):
    provider: str
    model: str


class ProviderSelectionResponse(BaseModel):
    llm: ProviderSelection
    embedding: ProviderSelection


class ProviderSelectionRequest(BaseModel):
    llm: ProviderSelection
    embedding: ProviderSelection


class RAGProviderInfo(BaseModel):
    key: str
    label: str


class RAGOptions(BaseModel):
    retrieval_strategies: List[str]
    vector_backends: List[RAGProviderInfo]
    chunking_methods: List[ChunkingMethod]
    defaults: dict


class RAGSelection(BaseModel):
    retrieval_strategy: str
    top_k: int = Field(default=5, ge=1, le=100)
    score_threshold: float | None = Field(default=None, ge=0.0, le=1.0)
    fetch_k: int | None = Field(default=None, ge=1, le=1000)
    lambda_mult: float | None = Field(default=None, ge=0.0, le=1.0)
    chunking_method: ChunkingMethod | None = None
    vector_backend: str = "chroma"


class RAGSelectionResponse(BaseModel):
    selection: RAGSelection


class RAGSelectionRequest(BaseModel):
    selection: RAGSelection
