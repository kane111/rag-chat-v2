from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import List # type: ignore
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings # pyright: ignore[reportUnusedImport]
from .database import Base, engine
from .routers import files, query, system, providers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Creating database tables if missing")
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown (if needed)


app = FastAPI(title="RAG Chat", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(system.router)
app.include_router(files.router)
app.include_router(query.router)
app.include_router(providers.router)


def _normalize_error(detail):
    """Normalize error payloads for consistent UI consumption."""
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
    return code, message, hint


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    correlation_id = str(uuid4())
    code, message, hint = _normalize_error(exc.detail)
    logger.error(
        "HTTPException %s %s code=%s cid=%s detail=%s",
        request.method,
        request.url.path,
        code,
        correlation_id,
        exc.detail,
        exc_info=exc,
    )
    payload = {"code": code, "message": message, "correlation_id": correlation_id}
    if hint:
        payload["hint"] = hint
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    correlation_id = str(uuid4())
    logger.exception("Unhandled error %s %s cid=%s", request.method, request.url.path, correlation_id)
    payload = {
        "code": "UNHANDLED_ERROR",
        "message": "Something went wrong on the server.",
        "correlation_id": correlation_id,
    }
    return JSONResponse(status_code=500, content=payload)
