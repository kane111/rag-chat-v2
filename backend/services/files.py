from __future__ import annotations

from pathlib import Path
from typing import Tuple

from fastapi import HTTPException, UploadFile, status

from ..config import settings


ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


def save_upload_file(upload: UploadFile) -> Tuple[Path, str]:
    content_type = upload.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    size_mb = 0.0
    destination = settings.file_dir / upload.filename
    with destination.open("wb") as buffer:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            size_mb += len(chunk) / (1024 * 1024)
            if size_mb > settings.max_file_mb:
                buffer.close()
                destination.unlink(missing_ok=True)
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds 50MB limit")
            buffer.write(chunk)
    upload.file.seek(0)
    return destination, ALLOWED_TYPES[content_type]
