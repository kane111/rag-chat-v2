# POST /query

- **Description**: Hybrid retrieval (Chroma semantic + BM25) over stored chunks, then generate an answer with Ollama `phi4-mini:latest`. Supports SSE streaming.
- **Dependencies**: `services.search.hybrid_search`, `services.generation.generate_answer`, `services.query_service.run_query`, `services.embedding.embed_text`.
- **Side effects**: Logs conversations, messages, queries, citations in SQLite; may stream tokens to clients.
- **Inputs**: `query` text, optional `conversation_id`, optional `top_k` (default 5), optional `stream` flag.
- **Outputs**: JSON with answer, context chunks + citations, and conversation id, or SSE stream when `stream=true`.
