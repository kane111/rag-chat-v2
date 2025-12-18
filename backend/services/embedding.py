from __future__ import annotations

from typing import List
from functools import lru_cache

import ollama
from fastapi import HTTPException, status
from langchain_openai import OpenAIEmbeddings

from ..config import settings
from .runtime_config import get_runtime_models


@lru_cache(maxsize=1)
def _ollama_client():
    return ollama.Client(host=settings.ollama_base_url)


@lru_cache(maxsize=1)
def _openai_embeddings():
    if not settings.openai_api_key:
        raise ValueError("OpenAI API key not configured (RAG_OPENAI_API_KEY)")
    models = get_runtime_models()
    return OpenAIEmbeddings(api_key=settings.openai_api_key, model=models["embedding_model"])


def reset_embedding_cache() -> None:
    _ollama_client.cache_clear()
    _openai_embeddings.cache_clear()


def embed_text(text: str) -> List[float]:
    try:
        models = get_runtime_models()
        provider = models["embedding_provider"]
        model = models["embedding_model"]

        if provider == "openai":
            embeddings = _openai_embeddings()
            result = embeddings.embed_query(text)
            return result
        elif provider == "ollama":
            client = _ollama_client()
            response = client.embeddings(model=model, prompt=text)
            return response["embedding"]
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Embedding failed: {exc}") from exc
