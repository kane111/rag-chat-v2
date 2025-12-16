from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..schemas import (
    ProviderListResponse,
    ProviderModelsResponse,
    ProviderModel,
    ProviderInfo,
    ProviderSelectionRequest,
    ProviderSelectionResponse,
    RAGOptions,
    RAGProviderInfo,
    RAGSelectionRequest,
    RAGSelectionResponse,
)
from ..services.providers import (
    get_embedding_providers,
    get_llm_providers,
    list_models_for_provider,
    serialize_models,
    serialize_providers,
)
from ..services.runtime_config import get_runtime_models, set_runtime_models, get_runtime_rag, set_runtime_rag, reset_runtime_rag
from langchain_core.vectorstores import VectorStoreRetriever

router = APIRouter(prefix="/providers")


@router.get("/llm", response_model=ProviderListResponse)
def list_llm_providers():
    providers = serialize_providers(get_llm_providers())
    return ProviderListResponse(providers=[ProviderInfo(**p) for p in providers])


@router.get("/embedding", response_model=ProviderListResponse)
def list_embedding_providers():
    providers = serialize_providers(get_embedding_providers())
    return ProviderListResponse(providers=[ProviderInfo(**p) for p in providers])


@router.get("/llm/{provider_key}/models", response_model=ProviderModelsResponse)
def list_llm_models(provider_key: str):
    try:
        models = serialize_models(list_models_for_provider(provider_key, "llm"))
    except KeyError:
        raise HTTPException(status_code=404, detail="LLM provider not found")
    return ProviderModelsResponse(
        provider=provider_key,
        type="llm",
        models=[ProviderModel(**model) for model in models],
    )


@router.get("/embedding/{provider_key}/models", response_model=ProviderModelsResponse)
def list_embedding_models(provider_key: str):
    try:
        models = serialize_models(list_models_for_provider(provider_key, "embedding"))
    except KeyError:
        raise HTTPException(status_code=404, detail="Embedding provider not found")
    return ProviderModelsResponse(
        provider=provider_key,
        type="embedding",
        models=[ProviderModel(**model) for model in models],
    )


@router.get("/selection", response_model=ProviderSelectionResponse)
def get_selection():
    current = get_runtime_models()
    return ProviderSelectionResponse(
        llm={"provider": current["chat_provider"], "model": current["chat_model"]},
        embedding={"provider": current["embedding_provider"], "model": current["embedding_model"]},
    )


@router.post("/selection", response_model=ProviderSelectionResponse)
def update_selection(body: ProviderSelectionRequest):
    try:
        updated = set_runtime_models(
            chat_provider=body.llm.provider,
            chat_model=body.llm.model,
            embedding_provider=body.embedding.provider,
            embedding_model=body.embedding.model,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return ProviderSelectionResponse(
        llm={"provider": updated["chat_provider"], "model": updated["chat_model"]},
        embedding={"provider": updated["embedding_provider"], "model": updated["embedding_model"]},
    )


@router.get("/rag/options", response_model=RAGOptions)
def rag_options():
    try:
        # LangChain-validated retrieval strategies; fallback to sensible defaults if missing
        strategies = list(getattr(VectorStoreRetriever, "allowed_search_types", []))
        if not strategies:
            strategies = ["similarity", "mmr", "similarity_score_threshold"]

        # Currently only Chroma is wired; expose registry for future backends
        backends = [
            {"key": "chroma", "label": "Chroma"},
        ]

        # Supported chunking methods as string values for easy JSON consumption
        from ..schemas import ChunkingMethod
        chunk_methods = [m.value for m in ChunkingMethod]

        defaults = get_runtime_rag()
        return RAGOptions(
            retrieval_strategies=strategies,
            vector_backends=[RAGProviderInfo(key=b["key"], label=b["label"]) for b in backends],
            chunking_methods=chunk_methods,  # type: ignore[arg-type]
            defaults=defaults,  # pydantic will serialize TypedDict
        )
    except Exception as exc:
        from fastapi import HTTPException
        # Surface a readable error instead of a generic 500
        raise HTTPException(status_code=500, detail=f"Failed to load RAG options: {exc}")


@router.get("/rag/selection", response_model=RAGSelectionResponse)
def rag_get_selection():
    current = get_runtime_rag()
    return RAGSelectionResponse(selection=current)  # type: ignore[arg-type]


@router.post("/rag/selection", response_model=RAGSelectionResponse)
def rag_update_selection(body: RAGSelectionRequest):
    try:
        updated = set_runtime_rag(body.selection.__dict__)  # type: ignore[arg-type]
    except ValueError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(exc))
    return RAGSelectionResponse(selection=updated)  # type: ignore[arg-type]


@router.post("/rag/reset", response_model=RAGSelectionResponse)
def rag_reset_selection():
    updated = reset_runtime_rag()
    return RAGSelectionResponse(selection=updated)  # type: ignore[arg-type]
