from __future__ import annotations

from functools import lru_cache
from typing import List

from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.vectorstores import VectorStore
from langchain_core.embeddings import Embeddings

from ..config import settings
from .runtime_config import get_runtime_models, get_runtime_rag


@lru_cache(maxsize=4)
def _embedding_client(model: str) -> Embeddings:
    return OllamaEmbeddings(base_url=settings.ollama_base_url, model=model)


@lru_cache(maxsize=4)
def _vectorstore(model: str) -> Chroma:
    return Chroma(
        collection_name=settings.chroma_collection,
        embedding_function=_embedding_client(model),
        persist_directory=str(settings.chroma_dir),
    )


def get_embeddings() -> Embeddings:
    """Return a cached embedding model for reuse across requests."""
    model = get_runtime_models()["embedding_model"]
    return _embedding_client(model)


def get_vectorstore() -> Chroma:
    """Return a cached Chroma vector store backed by LangChain."""
    model = get_runtime_models()["embedding_model"]
    return _vectorstore(model)


def reset_vectorstore_cache() -> None:
    _vectorstore.cache_clear()
    _embedding_client.cache_clear()


def add_documents(documents, ids: List[str]):
    """Add documents with explicit IDs so they align to chunk records."""
    vectorstore = get_vectorstore()
    vectorstore.add_documents(documents=documents, ids=ids)


def delete_by_file(file_id: int):
    """Remove all vectors for a given file id."""
    vectorstore = get_vectorstore()
    vectorstore.delete(where={"file_id": file_id})


def similarity_search_with_score(query: str, k: int):
    """Convenience wrapper for scored similarity search."""
    vectorstore = get_vectorstore()
    return vectorstore.similarity_search_with_score(query, k=k)


def retrieve(query: str, k: int, file_ids: List[int] | None = None):
    """Retrieve documents using configured strategy.

    - similarity: scored search
    - similarity_score_threshold: thresholded scored search
    - mmr: maximal marginal relevance (no score available)
    """
    vs = get_vectorstore()
    rag = get_runtime_rag()
    stype = rag["retrieval_strategy"]
    filter_clause = {"file_id": {"$in": file_ids}} if file_ids else None
    if stype == "similarity":
        return vs.similarity_search_with_score(query, k=k, filter=filter_clause)
    if stype == "similarity_score_threshold":
        # Use similarity search as fallback for threshold strategy
        # The relevance_scores method can produce invalid scores outside 0-1 range
        # depending on the embedding model, so we filter manually
        threshold = rag.get("score_threshold") or 0.0
        results = vs.similarity_search_with_score(query, k=k * 2, filter=filter_clause)  # Get more to filter
        filtered = [(doc, score) for doc, score in results if score >= threshold]
        return filtered[:k]
    if stype == "mmr":
        docs = vs.max_marginal_relevance_search(
            query,
            k=k,
            fetch_k=rag.get("fetch_k") or 20,
            lambda_mult=rag.get("lambda_mult") or 0.5,
            filter=filter_clause,
        )
        # Align interface: return (doc, score) pairs with score None
        return [(d, None) for d in docs]
    # Fallback to similarity
    return vs.similarity_search_with_score(query, k=k, filter=filter_clause)
