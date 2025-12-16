from __future__ import annotations

from typing import List

import ollama
from fastapi import HTTPException, status

from ..config import settings
from .runtime_config import get_runtime_models

_client = ollama.Client(host=settings.ollama_base_url)


def embed_text(text: str) -> List[float]:
    try:
        model = get_runtime_models()["embedding_model"]
        response = _client.embeddings(model=model, prompt=text)
        return response["embedding"]
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Embedding failed: {exc}") from exc
