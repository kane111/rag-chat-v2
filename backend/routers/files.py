from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, Form
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models import File as FileModel
from ..models import Chunk
from ..schemas import FileMeta, IngestResponse, ChunkOut, ChunkingMethod
from ..services.ingest import ingest_file, reingest_file, remove_file
from ..services.rag_store import similarity_search_with_score

logger = logging.getLogger("files")
router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
def ingest(
    file: UploadFile = File(...),
    chunking_method: str = Form(default=""),
    db: Session = Depends(get_db)
):
    # Use runtime RAG config if chunking_method not provided
    from ..services.runtime_config import get_runtime_rag
    
    if not chunking_method:
        rag_config = get_runtime_rag()
        chunking_method = rag_config.get("chunking_method") or "recursive_character"
    
    logger.info("ingest: filename=%s, chunking_method=%s", file.filename, chunking_method)
    # Validate and convert chunking_method string to enum
    try:
        method = ChunkingMethod(chunking_method)
    except ValueError:
        method = ChunkingMethod.RECURSIVE_CHARACTER
    
    record, chunk_count, raw_markdown = ingest_file(db, file, method)
    return IngestResponse(file=record, chunks=chunk_count, raw_markdown=raw_markdown)


@router.get("/files", response_model=List[FileMeta])
def list_files(db: Session = Depends(get_db)):
    files = db.query(FileModel).filter_by(deleted=False).order_by(FileModel.uploaded_at.desc()).all()
    return files


@router.put("/file/{file_id}", response_model=IngestResponse)
def update_file(
    file_id: int,
    file: UploadFile = File(...),
    chunking_method: str = Form(default=""),
    db: Session = Depends(get_db)
):
    # Use runtime RAG config if chunking_method not provided
    from ..services.runtime_config import get_runtime_rag
    
    if not chunking_method:
        rag_config = get_runtime_rag()
        chunking_method = rag_config.get("chunking_method") or "recursive_character"
    
    logger.info("update file=%s, chunking_method=%s", file_id, chunking_method)
    # Validate and convert chunking_method string to enum
    try:
        method = ChunkingMethod(chunking_method)
    except ValueError:
        method = ChunkingMethod.RECURSIVE_CHARACTER
    
    record, chunk_count, raw_markdown = reingest_file(db, file_id, file, method)
    return IngestResponse(file=record, chunks=chunk_count, raw_markdown=raw_markdown)


@router.delete("/file/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    logger.info("delete file=%s", file_id)
    remove_file(db, file_id)
    return {"status": "deleted"}


@router.get("/file/{file_id}/chunks", response_model=List[ChunkOut])
def get_file_chunks(file_id: int, db: Session = Depends(get_db)):
    """Get all chunks for a specific file."""
    logger.info("get chunks for file=%s", file_id)
    
    # Check if file exists
    file = db.query(FileModel).filter_by(id=file_id, deleted=False).first()
    if not file:
        from fastapi import HTTPException, status as http_status
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="File not found")
    
    # Get all chunks for this file, ordered by chunk_index
    chunks = db.query(Chunk).filter_by(file_id=file_id).order_by(Chunk.chunk_index).all()
    return chunks

 
