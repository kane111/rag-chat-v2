from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from langchain_core.documents import Document

from ..models import Chunk, File
from ..schemas import ChunkingMethod
from .conversion import convert_to_chunks
from .rag_store import add_documents, delete_by_file
from .files import save_upload_file


def ingest_file(
    session: Session,
    upload: UploadFile,
    chunking_method: ChunkingMethod = ChunkingMethod.RECURSIVE_CHARACTER
) -> Tuple[File, int, str]:
    destination, filetype = save_upload_file(upload)
    size_mb = destination.stat().st_size / (1024 * 1024)

    file_record = File(
        filename=upload.filename,
        filepath=str(destination),
        filetype=filetype,
        size_mb=round(size_mb, 2),
    )
    session.add(file_record)
    session.commit()
    session.refresh(file_record)

    chunk_count, used_docling, raw_markdown = _process_chunks(
        session, file_record, Path(destination), filetype, chunking_method
    )
    # Store docling usage in metadata (we'll need to add this field to the model)
    file_record.converted_with_docling = used_docling
    file_record.raw_markdown = raw_markdown
    session.commit()
    return file_record, chunk_count, raw_markdown


def remove_file(session: Session, file_id: int):
    file_obj = session.get(File, file_id)
    if not file_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    delete_by_file(file_id)
    path = Path(file_obj.filepath)
    if path.exists():
        path.unlink()
    session.delete(file_obj)
    session.commit()


def reingest_file(
    session: Session,
    file_id: int,
    upload: UploadFile,
    chunking_method: ChunkingMethod = ChunkingMethod.RECURSIVE_CHARACTER
):
    file_obj = session.get(File, file_id)
    if not file_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    delete_by_file(file_id)
    session.query(Chunk).filter_by(file_id=file_id).delete()
    session.commit()

    old_path = Path(file_obj.filepath)
    if old_path.exists():
        old_path.unlink()

    destination, filetype = save_upload_file(upload)
    size_mb = destination.stat().st_size / (1024 * 1024)

    file_obj.filename = upload.filename
    file_obj.filetype = filetype
    file_obj.filepath = str(destination)
    file_obj.size_mb = round(size_mb, 2)
    file_obj.updated_at = datetime.utcnow()
    session.commit()

    chunk_count, used_docling, raw_markdown = _process_chunks(
        session, file_obj, Path(destination), filetype, chunking_method
    )
    file_obj.converted_with_docling = used_docling
    file_obj.raw_markdown = raw_markdown
    session.commit()
    return file_obj, chunk_count, raw_markdown


def _process_chunks(
    session: Session,
    file_record: File,
    path: Path,
    filetype: str,
    chunking_method: ChunkingMethod
) -> Tuple[int, bool, str]:
    chunk_payloads, used_docling, raw_markdown = convert_to_chunks(path, filetype, chunking_method)
    if not chunk_payloads:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No content extracted from file")

    docs: list[Document] = []
    doc_ids: list[str] = []

    for idx, payload in enumerate(chunk_payloads):
        chunk = Chunk(
            file_id=file_record.id,
            chunk_index=idx,
            content=payload.text,
            section_heading=payload.section_heading,
            page_number=payload.page_number,
        )
        session.add(chunk)
        session.flush()
        docs.append(
            Document(
                page_content=payload.text,
                metadata={
                    "doc_id": str(file_record.id),
                    "file_id": file_record.id,
                    "chunk_id": chunk.id,
                    "section_heading": payload.section_heading,
                    "page_number": payload.page_number,
                },
            )
        )
        doc_ids.append(str(chunk.id))
    session.commit()
    if docs:
        add_documents(docs, ids=doc_ids)
    return len(docs), used_docling, raw_markdown
