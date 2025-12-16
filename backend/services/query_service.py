from __future__ import annotations

from typing import Generator, Iterable, List, Tuple

from sqlalchemy.orm import Session

from .generation import generate_answer
from .search import RetrievedChunk, retrieve_chunks


def _context_texts(retrieved: Iterable[RetrievedChunk]) -> List[str]:
    texts: List[str] = []
    for hit in retrieved:
        meta = []
        meta.append(f"doc_id={hit.doc_id}")
        if hit.page_number is not None:
            meta.append(f"page={hit.page_number}")
        if hit.section_heading:
            meta.append(f"section=\"{hit.section_heading}\"")
        header = ", ".join(meta)
        texts.append(f"[{header}]\n{hit.text}")
    return texts


def run_query(session: Session, query_text: str, top_k: int):
    retrieved = retrieve_chunks(session, query_text, top_k=top_k)

    contexts = _context_texts(retrieved)

    fallback = "I don't know based on the provided documents."

    # For streaming, if no context, emit the fallback once
    if not contexts:
        def empty_streamer() -> Generator[str, None, None]:
            yield fallback
        return empty_streamer(), retrieved

    def streamer() -> Generator[str, None, None]:
        for piece in generate_answer(query_text, contexts, stream=True):
            yield piece

    return streamer(), retrieved
