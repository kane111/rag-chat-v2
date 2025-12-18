# Technical Reference: Provider Architecture

## Abstract Class Hierarchy

```
BaseChatModel (langchain_core)
├── ChatOllama (langchain_ollama)
└── ChatOpenAI (langchain_openai)

Embeddings (langchain_core)
├── OllamaEmbeddings (langchain_ollama)
└── OpenAIEmbeddings (langchain_openai)
```

## Module Dependencies

```
generation.py
├── langchain_ollama.ChatOllama
├── langchain_openai.ChatOpenAI
├── langchain_core.language_models.BaseChatModel
├── langchain_core.messages.HumanMessage
└── langchain_text_splitters (for chunking)

embedding.py
├── ollama.Client
├── langchain_openai.OpenAIEmbeddings
├── langchain_ollama.OllamaEmbeddings
└── runtime_config.get_runtime_models()

rag_store.py
├── langchain_ollama.OllamaEmbeddings
├── langchain_openai.OpenAIEmbeddings
├── langchain_chroma.Chroma
├── langchain_core.embeddings.Embeddings
├── langchain_core.vectorstores.VectorStore
└── rank_bm25.BM25Okapi (for hybrid search)

conversion.py
├── docling (primary converter)
├── pdfminer.six (PDF extraction)
├── python-docx (DOCX parsing)
└── langchain_text_splitters (content chunking)
```

## Provider Selection Flow

```
┌─────────────────────────────────────────┐
│ User selects provider in /config UI     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ POST /providers/     │
         │ selection           │
         └──────────┬──────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │ set_runtime_models()          │
    │ - Validate provider available │
    │ - Validate model available    │
    │ - Persist to config.json      │
    └───────────────┬───────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    reset_chat_       reset_embedding_
    client_cache()    cache()
         │                     │
         ├─────────┬───────────┤
         │         │           │
         ▼         ▼           ▼
    Ollama   OpenAI    rag_store
    cache    cache     cache reset
    cleared  cleared   (vectorstore)
         │         │           │
         └─────────┴───────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ New providers   │
         │ active          │
         └──────────────────┘
```

## Request Flow: Chat Generation

```
User Query → /query/chat
    ↓
query_service.query()
    ├─ rag_store.retrieve()
    │   ├─ get_vectorstore()
    │   │   ├─ _vectorstore(provider, model)
    │   │   │   └─ Chroma(embedding=_get_embedding_client(provider, model))
    │   │   └─ Returns cached Chroma instance
    │   └─ Returns relevant chunks with scores
    │
    ├─ generation.generate_answer(question, contexts)
    │   ├─ build_prompt(question, contexts)
    │   ├─ _get_chat()
    │   │   ├─ get_runtime_models()
    │   │   ├─ if provider == "openai":
    │   │   │   └─ _openai_chat_client(model)
    │   │   └─ elif provider == "ollama":
    │   │       └─ _ollama_chat_client(model)
    │   └─ chat.invoke([HumanMessage(content=prompt)])
    │
    └─ Return answer with context citations
```

## Request Flow: Document Upload

```
User uploads file → /files/upload
    ↓
files_service.process_file()
    ├─ conversion.extract_text()
    ├─ ingest.chunk_document()
    ├─ embedding.embed_text() [per chunk]
    │   ├─ get_runtime_models()
    │   ├─ if provider == "openai":
    │   │   └─ _openai_embeddings()
    │   │       └─ embed_query(text)
    │   └─ elif provider == "ollama":
    │       └─ _ollama_client()
    │           └─ embeddings(model, prompt)
    │
    └─ rag_store.add_documents()
        ├─ get_vectorstore()
        └─ Chroma.add_documents()
```

## Caching Strategy

### LLM Client Cache
```python
@lru_cache(maxsize=4)
def _ollama_chat_client(model: str) -> ChatOllama:
    # Caches by model name
    # Max 4 models cached at once

@lru_cache(maxsize=4)
def _openai_chat_client(model: str) -> ChatOpenAI:
    # Caches by model name
    # Max 4 models cached at once
```

**Cache Key**: `(model_name)`
**Max Size**: 4 clients
**Cleared When**: Provider/model changed, or `reset_chat_client_cache()` called

### Embedding Client Cache
```python
@lru_cache(maxsize=1)
def _ollama_client():
    # Single Ollama client (stateless)

@lru_cache(maxsize=1)
def _openai_embeddings():
    # Single OpenAI embeddings instance
    # (API key cached internally)
```

**Cache Key**: `()`
**Max Size**: 1 instance each
**Cleared When**: Provider changed, or `reset_embedding_cache()` called

### Vector Store Cache
```python
@lru_cache(maxsize=4)
def _vectorstore(provider: str, model: str) -> Chroma:
    # Caches by (provider, model) tuple
    # Max 4 vectorstores at once
```

**Cache Key**: `(provider, model)`
**Max Size**: 4 stores
**Cleared When**: Provider/model changed, or `reset_vectorstore_cache()` called

## Configuration Storage

### File: `backend/storage/runtime_config.json`

```json
{
  "chat_provider": "openai",
  "chat_model": "gpt-4",
  "embedding_provider": "openai",
  "embedding_model": "text-embedding-3-small",
  "rag": {
    "retrieval_strategy": "similarity",
    "top_k": 5,
    "score_threshold": null,
    "fetch_k": 20,
    "lambda_mult": 0.5,
    "chunking_method": null,
    "vector_backend": "chroma"
  }
}
```

### Environment: `.env` (or system env)

```bash
RAG_OPENAI_API_KEY=sk-...
RAG_OLLAMA_BASE_URL=http://localhost:11434
RAG_STORAGE_DIR=./backend/storage
```

## Error Handling

### Provider Not Available

```python
# In _openai_available():
return _has_package("langchain_openai") and _has_package("openai")

# In API endpoint:
if not spec.available():
    return []  # Empty list = provider unavailable
```

**Result**: Provider doesn't appear in UI dropdown

### API Key Missing

```python
# In _openai_chat_client():
if not settings.openai_api_key:
    raise ValueError("OpenAI API key not configured")

# In router:
@router.post("/selection")
def update_selection(body: ProviderSelectionRequest):
    try:
        updated = set_runtime_models(...)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
```

**Result**: 400 Bad Request with clear error message

### API Connection Error

```python
try:
    client = OpenAI()
    response = client.models.list()
except Exception as exc:
    logger.warning("Failed to list OpenAI models: %s", exc)
    return []
```

**Result**: Provider appears available, but model list is empty

### Generation Failure

```python
try:
    chat = _get_chat()
    result = chat.invoke([HumanMessage(content=prompt)])
except Exception as exc:
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail={
            "code": "GENERATION_FAILED",
            "message": "Generation failed...",
            "hint": "Verify the model is reachable..."
        }
    )
```

**Result**: 502 Bad Gateway with actionable hint

## Provider Validation

When switching providers:

```python
def set_runtime_models(...):
    # 1. Validate provider exists and is available
    _validate_provider(chat_provider, "llm")
    _validate_provider(embedding_provider, "embedding")
    
    # 2. Validate model exists for provider
    _validate_model(chat_provider, "llm", chat_model)
    _validate_model(embedding_provider, "embedding", embedding_model)
    
    # 3. Persist configuration
    _CONFIG_PATH.write_text(json.dumps(data))
    
    # 4. Clear caches
    reset_chat_client_cache()
    reset_embedding_cache()
    reset_vectorstore_cache()
```

## Type System

### LangChain Types
```python
from langchain_core.language_models import BaseChatModel
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore
```

### Runtime Config Types
```python
class RuntimeModels(TypedDict):
    chat_provider: str        # "ollama" or "openai"
    chat_model: str           # "gpt-4", "mistral", etc.
    embedding_provider: str   # "ollama" or "openai"
    embedding_model: str      # "text-embedding-3-small", etc.
```

### API Schema Types
```python
class ProviderDescriptor(BaseModel):
    key: str                      # "ollama" or "openai"
    label: str                    # "Ollama" or "OpenAI"
    type: Literal["llm", "embedding"]

class ModelInfo(BaseModel):
    id: str                       # Model identifier
    label: str                    # Display name
    context_length: Optional[int] # Token limit
```

## Provider-Specific Behavior

### Ollama
- **Base URL**: `http://localhost:11434` (configurable)
- **Models**: Dynamically pulled from local Ollama
- **Auth**: None (local by default)
- **Cost**: Free (local)
- **Speed**: Depends on GPU
- **Privacy**: All processing local

### OpenAI
- **Base URL**: `api.openai.com`
- **Models**: Fetched via OpenAI API
- **Auth**: API key required
- **Cost**: Pay per token
- **Speed**: Cloud-based, consistent
- **Privacy**: Data sent to OpenAI

## Example: Adding a New Provider

To add support for a new provider (e.g., Anthropic):

### 1. Add to providers.py

```python
def _anthropic_available() -> bool:
    return _has_package("langchain_anthropic") and _has_package("anthropic")

def _list_anthropic_models() -> List[ModelInfo]:
    # Fetch models from Anthropic API
    ...

_LLM_PROVIDERS.append(ProviderSpec(
    descriptor=ProviderDescriptor(key="anthropic", label="Anthropic", type="llm"),
    available=_anthropic_available,
    list_models=_list_anthropic_models,
))
```

### 2. Add to generation.py

```python
from langchain_anthropic import ChatAnthropic

@lru_cache(maxsize=4)
def _anthropic_chat_client(model: str) -> ChatAnthropic:
    return ChatAnthropic(api_key=settings.anthropic_api_key, model=model)

def _get_chat() -> BaseChatModel:
    models = get_runtime_models()
    provider = models["chat_provider"]
    model = models["chat_model"]
    
    if provider == "anthropic":
        return _anthropic_chat_client(model)
    # ... existing providers
```

### 3. Add config

```python
# config.py
anthropic_api_key: str = ""  # RAG_ANTHROPIC_API_KEY
```

That's it! The UI and API endpoints automatically support it.

## Testing Approach

### Unit Testing
```python
def test_provider_selection():
    # Test set_runtime_models() with valid/invalid inputs
    # Test reset functions clear caches
    
def test_generation():
    # Mock _get_chat() to return test client
    # Test prompt building
    # Test response parsing

def test_embeddings():
    # Mock embedding clients
    # Test embed_text() returns correct vectors
    
def test_rag_store():
    # Mock vectorstore
    # Test retrieve() with different strategies
```

### Integration Testing
```python
def test_provider_switching():
    # 1. Start with Ollama
    # 2. Switch to OpenAI
    # 3. Verify generation works
    # 4. Verify embeddings work
    # 5. Switch back to Ollama
    # 6. Verify caches cleared

def test_independent_providers():
    # Test all combinations:
    # - Ollama + Ollama
    # - Ollama + OpenAI
    # - OpenAI + Ollama
    # - OpenAI + OpenAI
```

## Performance Metrics

Typical response times (with both providers available):

| Operation          | Ollama | OpenAI | Notes                |
| ------------------ | ------ | ------ | -------------------- |
| Model list         | <1s    | 1-2s   | API call required    |
| LLM cache hit      | <50ms  | <50ms  | Just LRU lookup      |
| Embedding (cached) | <10ms  | <10ms  | Just cache lookup    |
| Full chat response | 2-10s  | 1-3s   | Network + generation |
| Provider switch    | <500ms | <500ms | Cache clear          |

---

**Last Updated**: December 2024
**Version**: 2.0
**Status**: Production Ready
**Minimum Requirements**: Python 3.9+, Node.js 18+, Next.js 16.0.10+
