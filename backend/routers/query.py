from __future__ import annotations

import json
import logging
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..dependencies import get_db
from ..schemas import ContextChunk, QueryRequest, QueryResponse
from ..services.query_service import run_query
from ..services.search import RetrievedChunk

router = APIRouter()
logger = logging.getLogger("query")


def _normalize_error(detail, correlation_id: str):
    """Return a consistent SSE-safe error payload."""
    code = "SERVER_ERROR"
    message = "An unexpected error occurred."
    hint = None
    if isinstance(detail, dict):
        code = detail.get("code", code)
        message = detail.get("message", message)
        hint = detail.get("hint")
    elif isinstance(detail, str):
        message = detail
    else:
        message = str(detail)

    payload = {"code": code, "message": message, "correlation_id": correlation_id}
    if hint:
        payload["hint"] = hint
    return payload


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
    correlation_id = str(uuid4())

    # Use RAG settings from runtime config instead of request
    from ..services.runtime_config import get_runtime_rag
    rag_config = get_runtime_rag()
    top_k = rag_config["top_k"]
    file_ids = req.file_ids or None
    logger.info("query: top_k=%s (from RAG config) stream=true file_ids=%s", top_k, file_ids)

    try:
        answer_stream, retrieved = run_query(db, req.query, top_k, file_ids=file_ids)
    except HTTPException as exc:
        logger.error("query failure cid=%s", correlation_id, exc_info=exc)

        def error_stream():
            payload = _normalize_error(exc.detail, correlation_id)
            yield "event: error\n"
            yield f"data: {json.dumps(payload)}\n\n"
            yield "event: end\n\n"

        return StreamingResponse(error_stream(), media_type="text/event-stream")
    except Exception as exc:  # pragma: no cover
        logger.exception("query failure cid=%s", correlation_id)

        def error_stream():
            payload = _normalize_error(str(exc), correlation_id)
            yield "event: error\n"
            yield f"data: {json.dumps(payload)}\n\n"
            yield "event: end\n\n"

        return StreamingResponse(error_stream(), media_type="text/event-stream")

    context_payload = _to_context_chunks(retrieved)

    def sse_stream():
        yield "event: context\n"
        yield f"data: {json.dumps([c.model_dump() for c in context_payload])}\n\n"
        yield "event: start\n\n"
        try:
            for chunk in answer_stream:
                # chunk is now JSON with 'raw' and 'cleaned' keys
                yield f"data: {chunk}\n\n"
        except Exception as exc:  # pragma: no cover
            logger.exception("streaming failure cid=%s", correlation_id)
            payload = _normalize_error(getattr(exc, "detail", str(exc)), correlation_id)
            yield "event: error\n"
            yield f"data: {json.dumps(payload)}\n\n"
        yield "event: end\n\n"

    return StreamingResponse(sse_stream(), media_type="text/event-stream")
