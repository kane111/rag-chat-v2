from __future__ import annotations

from typing import Generator, Iterable, List
from functools import lru_cache
import logging

from fastapi import HTTPException, status
from langchain_core.messages import HumanMessage
from langchain_ollama import ChatOllama

from ..config import settings
from .runtime_config import get_runtime_models


logger = logging.getLogger("generation")


@lru_cache(maxsize=4)
def _chat_client(model: str) -> ChatOllama:
    # Cache clients per-model to avoid recreating transports.
    return ChatOllama(base_url=settings.ollama_base_url, model=model)


def _get_chat() -> ChatOllama:
    models = get_runtime_models()
    return _chat_client(models["chat_model"])


def reset_chat_client_cache() -> None:
    _chat_client.cache_clear()


def build_prompt(question: str, contexts: Iterable[str]) -> str:
    context_text = "\n\n".join(contexts)
    return (
        "System role: You are a focused RAG assistant. Use ONLY the provided context to answer. "
        "If the context is missing or unclear, say `I don't know based on the provided documents.`\n"
        "Guidelines:\n"
        "- Be concise and factual.\n"
        "- Do not invent details.\n"
        "- Write a coherent, flowing response.\n"
        "- If multiple sources support a point, list them together in brackets at the end.\n"
        "- If context conflicts, state the conflict briefly, then cite sources at the end.\n\n"
        f"Context:\n{context_text}\n\n"
        f"Question: {question}\n"
        "Answer:"
    )


def generate_answer(question: str, contexts: List[str], stream: bool = False):
    prompt = build_prompt(question, contexts)
    try:
        chat = _get_chat()
        if stream:
            return _stream(prompt, chat)
        result = chat.invoke([HumanMessage(content=prompt)])
        raw = result.content or ""
        return _cleanup_text(str(raw))
    except Exception as exc:  # pragma: no cover
        detail = {
            "code": "GENERATION_FAILED",
            "message": "Generation failed while contacting the model.",
            "hint": "Verify the model is reachable and retry.",
        }
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc


def _stream(prompt: str, chat: ChatOllama) -> Generator[str, None, None]:
    stream = chat.stream([HumanMessage(content=prompt)])
    for chunk in stream:
        piece = chunk.content
        if piece:
            # Yield both raw and cleaned versions as JSON to preserve downstream contract
            import json
            yield json.dumps({"raw": piece, "cleaned": piece})


def _cleanup_text(text: str) -> str:
    return text.strip()


# Suggested questions generation removed
