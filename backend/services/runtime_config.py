from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Literal, TypedDict, Optional

from ..config import settings
from .providers import (
    get_embedding_providers,
    get_llm_providers,
    list_models_for_provider,
)


class RuntimeModels(TypedDict):
    chat_provider: str
    chat_model: str
    embedding_provider: str
    embedding_model: str


class RuntimeRAG(TypedDict):
    retrieval_strategy: str
    top_k: int
    score_threshold: Optional[float]
    fetch_k: Optional[int]
    lambda_mult: Optional[float]
    chunking_method: Optional[str]
    vector_backend: str


_CONFIG_PATH: Path = settings.storage_dir / "runtime_config.json"
_LOCK = Lock()


def _ensure_storage_dir() -> None:
    _CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)


def _defaults() -> RuntimeModels:
    return {
        "chat_provider": "ollama",
        "chat_model": settings.chat_model,
        "embedding_provider": "ollama",
        "embedding_model": settings.embedding_model,
    }


def _rag_defaults() -> RuntimeRAG:
    return {
        "retrieval_strategy": "similarity",
        "top_k": settings.top_k,
        "score_threshold": None,
        "fetch_k": 20,
        "lambda_mult": 0.5,
        "chunking_method": None,
        "vector_backend": "chroma",
    }


def _read_config() -> RuntimeModels:
    _ensure_storage_dir()
    if not _CONFIG_PATH.exists():
        models = _defaults()
        data = {**models, "rag": _rag_defaults()}
        _CONFIG_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return models

    try:
        raw = json.loads(_CONFIG_PATH.read_text(encoding="utf-8"))
        models = RuntimeModels(
            chat_provider=raw.get("chat_provider") or "ollama",
            chat_model=raw.get("chat_model") or settings.chat_model,
            embedding_provider=raw.get("embedding_provider") or "ollama",
            embedding_model=raw.get("embedding_model") or settings.embedding_model,
        )
        # Ensure RAG block exists
        if "rag" not in raw:
            raw["rag"] = _rag_defaults()
            _CONFIG_PATH.write_text(json.dumps(raw, indent=2), encoding="utf-8")
        return models
    except Exception:
        models = _defaults()
        _CONFIG_PATH.write_text(json.dumps({**models, "rag": _rag_defaults()}, indent=2), encoding="utf-8")
        return models


def get_runtime_models() -> RuntimeModels:
    with _LOCK:
        return _read_config()


def get_runtime_rag() -> RuntimeRAG:
    with _LOCK:
        _ensure_storage_dir()
        raw = json.loads(_CONFIG_PATH.read_text(encoding="utf-8")) if _CONFIG_PATH.exists() else {}
        rag = raw.get("rag") or _rag_defaults()
        return RuntimeRAG(
            retrieval_strategy=rag.get("retrieval_strategy") or "similarity",
            top_k=int(rag.get("top_k") or settings.top_k),
            score_threshold=rag.get("score_threshold"),
            fetch_k=rag.get("fetch_k"),
            lambda_mult=rag.get("lambda_mult"),
            chunking_method=rag.get("chunking_method"),
            vector_backend=rag.get("vector_backend") or "chroma",
        )


def _validate_provider(provider_key: str, kind: Literal["llm", "embedding"]) -> None:
    providers = get_llm_providers() if kind == "llm" else get_embedding_providers()
    if not any(p.key == provider_key for p in providers):
        raise ValueError(f"Provider '{provider_key}' is not available for {kind}")


def _validate_model(provider_key: str, kind: Literal["llm", "embedding"], model_id: str) -> None:
    available = list_models_for_provider(provider_key, kind)
    if not any(m.id == model_id for m in available):
        raise ValueError(f"Model '{model_id}' not found for provider '{provider_key}'")


def set_runtime_models(
    chat_provider: str,
    chat_model: str,
    embedding_provider: str,
    embedding_model: str,
) -> RuntimeModels:
    with _LOCK:
        _validate_provider(chat_provider, "llm")
        _validate_provider(embedding_provider, "embedding")
        _validate_model(chat_provider, "llm", chat_model)
        _validate_model(embedding_provider, "embedding", embedding_model)

        prev = json.loads(_CONFIG_PATH.read_text(encoding="utf-8")) if _CONFIG_PATH.exists() else {}
        data: dict = {
            "chat_provider": chat_provider,
            "chat_model": chat_model,
            "embedding_provider": embedding_provider,
            "embedding_model": embedding_model,
            "rag": prev.get("rag") or _rag_defaults(),
        }
        _CONFIG_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")

    # Refresh caches after releasing the lock to avoid circular imports during validation
    try:
        from .generation import reset_chat_client_cache
        from .embedding import reset_embedding_cache
        from .rag_store import reset_vectorstore_cache

        reset_chat_client_cache()
        reset_embedding_cache()
        reset_vectorstore_cache()
    except Exception:
        # Cache refresh best-effort; failures should not block persisted config
        pass

    return data


def set_runtime_rag(selection: RuntimeRAG) -> RuntimeRAG:
    with _LOCK:
        # Basic validation of search type; allowed by LangChain retriever
        allowed = {"similarity", "similarity_score_threshold", "mmr"}
        if selection["retrieval_strategy"] not in allowed:
            raise ValueError(f"Unsupported retrieval strategy '{selection['retrieval_strategy']}'")
        prev = json.loads(_CONFIG_PATH.read_text(encoding="utf-8")) if _CONFIG_PATH.exists() else {}
        prev["rag"] = {
            "retrieval_strategy": selection.get("retrieval_strategy") or "similarity",
            "top_k": int(selection.get("top_k") or settings.top_k),
            "score_threshold": selection.get("score_threshold"),
            "fetch_k": selection.get("fetch_k"),
            "lambda_mult": selection.get("lambda_mult"),
            "chunking_method": selection.get("chunking_method"),
            "vector_backend": selection.get("vector_backend") or "chroma",
        }
        _CONFIG_PATH.write_text(json.dumps(prev, indent=2), encoding="utf-8")

    try:
        from .rag_store import reset_vectorstore_cache
        reset_vectorstore_cache()
    except Exception:
        pass

    return get_runtime_rag()


def reset_runtime_rag() -> RuntimeRAG:
    with _LOCK:
        prev = json.loads(_CONFIG_PATH.read_text(encoding="utf-8")) if _CONFIG_PATH.exists() else {}
        prev["rag"] = _rag_defaults()
        _CONFIG_PATH.write_text(json.dumps(prev, indent=2), encoding="utf-8")
    return get_runtime_rag()
