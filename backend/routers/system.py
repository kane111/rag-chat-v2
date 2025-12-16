from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models import Chunk, File
from ..schemas import StatsResponse

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/stats", response_model=StatsResponse)
def stats(db: Session = Depends(get_db)):
    files = db.query(func.count(File.id)).scalar() or 0
    chunks = db.query(func.count(Chunk.id)).scalar() or 0
    return StatsResponse(files=files, chunks=chunks)
