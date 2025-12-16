from __future__ import annotations

from dataclasses import dataclass
from typing import List

from sqlalchemy.orm import Session

from ..models import File
from .rag_store import retrieve


@dataclass
class RetrievedChunk:
    chunk_id: int
    file_id: int
    doc_id: str
    filename: str
    text: str
    section_heading: str | None
    page_number: int | None
    score: float


def retrieve_chunks(session: Session, query: str, top_k: int) -> List[RetrievedChunk]:
    """LangChain-powered retrieval from vector store with stored metadata."""
    results = retrieve(query, k=top_k)
    retrieved: List[RetrievedChunk] = []

    for doc, score in results:
        meta = doc.metadata or {}
        chunk_id = int(meta.get("chunk_id")) if meta.get("chunk_id") is not None else -1
        file_id = int(meta.get("file_id")) if meta.get("file_id") is not None else -1
        doc_id = str(meta.get("doc_id")) if meta.get("doc_id") is not None else ""
        retrieved.append(
            RetrievedChunk(
                chunk_id=chunk_id,
                file_id=file_id,
                doc_id=doc_id,
                filename="",  # Will be populated from database
                text=doc.page_content,
                section_heading=meta.get("section_heading"),
                page_number=meta.get("page_number"),
                score=score or 0.0,
            )
        )

    # Populate filenames from database
    file_cache = {}
    for hit in retrieved:
        if hit.file_id not in file_cache:
            file = session.get(File, hit.file_id)
            file_cache[hit.file_id] = file
        file = file_cache[hit.file_id]
        if file:
            hit.filename = file.filename

    return retrieved
