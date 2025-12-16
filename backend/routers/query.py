from __future__ import annotations

import json
import logging
from typing import List

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..dependencies import get_db
from ..schemas import ContextChunk, QueryRequest, QueryResponse
from ..services.query_service import run_query
from ..services.search import RetrievedChunk

router = APIRouter()
logger = logging.getLogger("query")


def _to_context_chunks(retrieved: List[RetrievedChunk]) -> List[ContextChunk]:
    context: List[ContextChunk] = []
    for hit in retrieved:
        context.append(
            ContextChunk(
                chunk=hit.text,
                citation={
                    "doc_id": hit.doc_id,
                    "filename": hit.filename,
                    "page": hit.page_number,
                    "section": hit.section_heading,
                },
            )
        )
    return context


@router.post("/query")
def query(req: QueryRequest, db: Session = Depends(get_db)):
    top_k = req.top_k or settings.top_k
    logger.info("query: top_k=%s stream=true", top_k)
    
    answer_stream, retrieved = run_query(db, req.query, top_k)
    context_payload = _to_context_chunks(retrieved)

    def sse_stream():
        yield "event: context\n"
        yield f"data: {json.dumps([c.model_dump() for c in context_payload])}\n\n"
        yield "event: start\n\n"
        for chunk in answer_stream:
            # chunk is now JSON with 'raw' and 'cleaned' keys
            yield f"data: {chunk}\n\n"
        yield "event: end\n\n"

    return StreamingResponse(sse_stream(), media_type="text/event-stream")
