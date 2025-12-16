from __future__ import annotations

from typing import Generator

from .database import SessionLocal


def get_db() -> Generator:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
