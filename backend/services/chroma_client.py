from __future__ import annotations

from typing import Any, Dict, List

import chromadb
from chromadb.api import Collection

from ..config import settings


_client = chromadb.PersistentClient(path=str(settings.chroma_dir))
_collection: Collection | None = None


def get_collection() -> Collection:
    global _collection
    if _collection is None:
        _collection = _client.get_or_create_collection(name=settings.chroma_collection, metadata={"hnsw:space": "cosine"})
    return _collection


def upsert_chunks(ids: List[str], embeddings: List[List[float]], documents: List[str], metadatas: List[Dict[str, Any]]):
    collection = get_collection()
    collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def delete_by_file(file_id: int):
    collection = get_collection()
    collection.delete(where={"file_id": file_id})


def query_embeddings(query_embedding: List[float], top_k: int):
    collection = get_collection()
    # Newer Chroma versions always return ids; passing "ids" in include now raises a validation error
    return collection.query(query_embeddings=[query_embedding], n_results=top_k, include=["metadatas", "documents", "distances"])
