from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Callable, List, Literal, Optional
import importlib.util
import logging

import ollama

from ..config import settings

logger = logging.getLogger("providers")


@dataclass
class ProviderDescriptor:
    key: str
    label: str
    type: Literal["llm", "embedding"]


@dataclass
class ModelInfo:
    id: str
    label: str
    context_length: Optional[int] = None


@dataclass
class ProviderSpec:
    descriptor: ProviderDescriptor
    available: Callable[[], bool]
    list_models: Callable[[], List[ModelInfo]]


def _has_package(pkg: str) -> bool:
    return importlib.util.find_spec(pkg) is not None


def _ollama_available() -> bool:
    # Use the official Ollama SDK presence as the gate for availability
    return _has_package("ollama")


def _list_ollama_models() -> List[ModelInfo]:
    # Fetch via the Ollama Python SDK; honors configured base URL
    # Newer SDKs require using a Client to pass the host, and return
    # a response object rather than a plain dict. Handle both.
    try:
        client = ollama.Client(host=settings.ollama_base_url)
        data = client.list()

        # Extract models from either dict or SDK response object
        if isinstance(data, dict):
            raw_models = data.get("models", [])
        else:
            raw_models = getattr(data, "models", []) or []

        items: List[ModelInfo] = []
        for entry in raw_models:
            # Support dict and object entries
            if isinstance(entry, dict):
                model_id = entry.get("model") or entry.get("name")
                label = entry.get("name") or model_id
                details = entry.get("details") or {}
                ctx = details.get("context_length") or details.get("ctx")
            else:
                model_id = getattr(entry, "model", None) or getattr(entry, "name", None)
                label = getattr(entry, "name", None) or model_id
                details = getattr(entry, "details", None) or {}
                # details may be an object
                ctx = getattr(details, "context_length", None) or getattr(details, "ctx", None)

            if not model_id:
                continue
            # Ensure context_length is an int if present
            if not isinstance(ctx, int):
                try:
                    ctx = int(ctx)  # some SDKs may return numeric strings
                except Exception:
                    ctx = None
            items.append(ModelInfo(id=model_id, label=label or model_id, context_length=ctx))

        return items
    except Exception as exc:  # pragma: no cover - depends on local runtime
        logger.warning("Failed to list Ollama models: %s", exc)
        return []


def _openai_available() -> bool:
    # Only show OpenAI if both the integration and API client are present
    return _has_package("langchain_openai") and _has_package("openai")


def _list_openai_models() -> List[ModelInfo]:
    try:
        from openai import OpenAI
    except Exception as exc:  # pragma: no cover - optional dependency
        logger.warning("OpenAI SDK not available: %s", exc)
        return []

    try:
        # Use API key from settings if configured
        api_key = settings.openai_api_key or None
        client = OpenAI(api_key=api_key) if api_key else OpenAI()
        response = client.models.list()
        models: List[ModelInfo] = []
        
        # Known context lengths for popular OpenAI models
        CONTEXT_LENGTHS = {
            "gpt-4": 8192,
            "gpt-4-0613": 8192,
            "gpt-4-32k": 32768,
            "gpt-4-32k-0613": 32768,
            "gpt-4-turbo": 128000,
            "gpt-4-turbo-preview": 128000,
            "gpt-4-1106-preview": 128000,
            "gpt-4-0125-preview": 128000,
            "gpt-4o": 128000,
            "gpt-4o-mini": 128000,
            "gpt-3.5-turbo": 16385,
            "gpt-3.5-turbo-16k": 16385,
            "gpt-3.5-turbo-0613": 4096,
            "gpt-3.5-turbo-16k-0613": 16385,
            "gpt-3.5-turbo-1106": 16385,
            "gpt-3.5-turbo-0125": 16385,
            "text-embedding-ada-002": 8191,
            "text-embedding-3-small": 8191,
            "text-embedding-3-large": 8191,
        }
        
        for model in getattr(response, "data", []):
            model_id = getattr(model, "id", None)
            if not model_id:
                continue
            
            # Try to get context length from model or use known values
            context = getattr(model, "context_length", None) or getattr(model, "context_window", None)
            if not context:
                # Try to match against known models
                for known_model, known_context in CONTEXT_LENGTHS.items():
                    if model_id.startswith(known_model):
                        context = known_context
                        break
            
            models.append(ModelInfo(id=model_id, label=model_id, context_length=context))
        
        # Sort models by ID for easier browsing (GPT-4 models first, then GPT-3.5, then others)
        def sort_key(m: ModelInfo) -> tuple:
            id_lower = m.id.lower()
            if id_lower.startswith("gpt-4o"):
                return (0, m.id)
            elif id_lower.startswith("gpt-4"):
                return (1, m.id)
            elif id_lower.startswith("gpt-3.5"):
                return (2, m.id)
            elif id_lower.startswith("text-embedding"):
                return (3, m.id)
            else:
                return (4, m.id)
        
        models.sort(key=sort_key)
        return models
    except Exception as exc:  # pragma: no cover - depends on credentials
        logger.warning("Failed to list OpenAI models: %s", exc)
        return []


_LLM_PROVIDERS: List[ProviderSpec] = [
    ProviderSpec(
        descriptor=ProviderDescriptor(key="ollama", label="Ollama", type="llm"),
        available=_ollama_available,
        list_models=_list_ollama_models,
    ),
    ProviderSpec(
        descriptor=ProviderDescriptor(key="openai", label="OpenAI", type="llm"),
        available=_openai_available,
        list_models=_list_openai_models,
    ),
]


_EMBEDDING_PROVIDERS: List[ProviderSpec] = [
    ProviderSpec(
        descriptor=ProviderDescriptor(key="ollama", label="Ollama", type="embedding"),
        available=_ollama_available,
        list_models=_list_ollama_models,
    ),
    ProviderSpec(
        descriptor=ProviderDescriptor(key="openai", label="OpenAI", type="embedding"),
        available=_openai_available,
        list_models=_list_openai_models,
    ),
]


def get_llm_providers() -> List[ProviderDescriptor]:
    return [spec.descriptor for spec in _LLM_PROVIDERS if spec.available()]


def get_embedding_providers() -> List[ProviderDescriptor]:
    return [spec.descriptor for spec in _EMBEDDING_PROVIDERS if spec.available()]


def list_models_for_provider(provider_key: str, kind: Literal["llm", "embedding"]) -> List[ModelInfo]:
    specs = _LLM_PROVIDERS if kind == "llm" else _EMBEDDING_PROVIDERS
    for spec in specs:
        if spec.descriptor.key == provider_key:
            if not spec.available():
                return []
            return spec.list_models()
    raise KeyError(provider_key)


def serialize_providers(providers: List[ProviderDescriptor]) -> List[dict]:
    return [asdict(provider) for provider in providers]


def serialize_models(models: List[ModelInfo]) -> List[dict]:
    return [asdict(model) for model in models]
