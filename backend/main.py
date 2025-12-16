from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import List # type: ignore

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
