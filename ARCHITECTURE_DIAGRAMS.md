# Visual Architecture Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     RAG Chat Application                        │
│                   Multi-Provider Architecture                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│      Frontend (UI)       │         │  Configuration Storage   │
│   (Next.js + React)      │◄───────►│  (JSON + Environment)    │
│                          │         │                          │
│  /config page            │         │  runtime_config.json     │
│  - Provider dropdown     │         │  RAG_OPENAI_API_KEY      │
│  - Model selector        │         │  RAG_OLLAMA_BASE_URL     │
│  - Save/Apply button     │         │                          │
└──────────┬───────────────┘         └──────────────────────────┘
           │
           │ REST API calls
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   routers/providers.py   │  ◄─── Endpoints:
│                          │      GET  /providers/llm
│  - List providers        │      GET  /providers/embedding
│  - List models          │      POST /providers/selection
│  - Get/Set selection    │      GET  /providers/selection
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────┐
│         services/runtime_config.py                              │
│                                                                  │
│  ┌─────────────────────┐                                        │
│  │  Persistent Config  │  ◄─── Stores:                          │
│  │  - chat_provider    │      • Provider selections             │
│  │  - chat_model       │      • Model names                     │
│  │  - embedding_*      │      • RAG settings                    │
│  └─────────────────────┘                                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Cache Management                                      │    │
│  │  - reset_chat_client_cache()                          │    │
│  │  - reset_embedding_cache()                            │    │
│  │  - reset_vectorstore_cache()                          │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────┬──────────────────────────────────────────────────┘
               │
       ┌───────┴────────┬──────────────┬──────────────┐
       │                │              │              │
       ▼                ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│generation  │  │embedding   │  │rag_store   │  │providers   │
│.py         │  │.py         │  │.py         │  │.py         │
│            │  │            │  │            │  │            │
│LLM Core    │  │Embedding   │  │Vector DB   │  │Registry    │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └──────┬─────┘
      │               │               │               │
      │               │               │               │
      ▼               ▼               ▼               ▼

    ┌──────────────────────────────────────────────────┐
    │         LangChain Abstraction Layer              │
    ├──────────────────────────────────────────────────┤
    │                                                  │
    │  LLM Providers:                                  │
    │  ┌─────────────────────────────────────────┐   │
    │  │ ChatOllama        │  ChatOpenAI         │   │
    │  │ (langchain-ollama)│ (langchain-openai)  │   │
    │  └────────┬──────────┴──────────┬──────────┘   │
    │           │ Both inherit from BaseChatModel    │
    │           └──────────────────────┘             │
    │                                                  │
    │  Embedding Providers:                           │
    │  ┌─────────────────────────────────────────┐   │
    │  │ OllamaEmbeddings │ OpenAIEmbeddings     │   │
    │  │ (langchain-ollama)│ (langchain-openai)  │   │
    │  └────────┬──────────┴──────────┬──────────┘   │
    │           │ Both inherit from Embeddings      │
    │           └──────────────────────┘             │
    │                                                  │
    │  Vector Store:                                   │
    │  ┌─────────────────────────────────────────┐   │
    │  │ Chroma (langchain-chroma)               │   │
    │  │ Uses any Embeddings provider            │   │
    │  └─────────────────────────────────────────┘   │
    │                                                  │
    └──────────────────────────────────────────────────┘

            ↓                          ↓
    ┌──────────────────┐     ┌──────────────────┐
    │   Ollama API     │     │   OpenAI API     │
    │                  │     │                  │
    │  localhost:11434 │     │ api.openai.com   │
    │                  │     │                  │
    │  - Chat models   │     │ - Chat models    │
    │  - Embeddings    │     │ - Embeddings     │
    └──────────────────┘     └──────────────────┘
```

## Data Flow: Chat Query

```
User Question
        │
        ▼
    /query/chat endpoint
        │
        ├─────────────────────────────┬──────────────────┐
        │                             │                  │
        ▼                             ▼                  ▼
    Retrieve Context        Get LLM Client       Build Prompt
    ┌──────────────┐        ┌──────────────┐     ┌──────────────┐
    │rag_store.py │        │generation.py │     │generation.py │
    │              │        │              │     │              │
    │1. Get vector │        │ get_runtime  │     │ build_prompt │
    │   store with │        │ _models()    │     │              │
    │   selected   │        │              │     │ Combines:    │
    │   embedding  │        │ Select based │     │ - Context    │
    │   provider   │        │ on provider  │     │ - Question   │
    │              │        │              │     │ - System msg │
    │2. Search for │        │ Return       │     │              │
    │   similar    │        │ ChatOllama   │     │ Returns:     │
    │   chunks     │        │ or           │     │ Prompt str   │
    │              │        │ ChatOpenAI   │     └──────────────┘
    │3. Return     │        └──────────────┘
    │   results    │
    └──────────────┘
        │
        └─────────────────────┬──────────────────┐
                              │                  │
                              ▼                  ▼
                        Generate Response   Cite Sources
                        ┌──────────────┐    ┌──────────────┐
                        │Chat client   │    │Search results│
                        │.invoke()     │    │contain:      │
                        │              │    │- File names  │
                        │1. Send to    │    │- Sections    │
                        │   LLM API    │    │- Page nums   │
                        │              │    │              │
                        │2. Stream or  │    │Add citations │
                        │   buffer     │    │to response   │
                        │   response   │    │              │
                        │              │    │Return to UI  │
                        │3. Clean &    │    └──────────────┘
                        │   format     │
                        │              │
                        │Return answer │
                        └──────────────┘
                              │
                              ▼
                        Response to User
                    (with sources highlighted)
```

## State Management: Provider Switching

```
Initial State:
┌────────────────────┐
│  Ollama LLM        │
│  Ollama Embedding  │
│  Cached instances  │
└────────────────────┘

User clicks: "Switch to OpenAI" in UI
        │
        ▼
POST /providers/selection
{
  "llm": {"provider": "openai", "model": "gpt-4"},
  "embedding": {"provider": "openai", "model": "text-embedding-3-small"}
}
        │
        ▼
set_runtime_models()
        │
        ├─ Validate provider available
        │         │
        │         ├─ _has_package("langchain_openai")? ✓
        │         └─ _has_package("openai")? ✓
        │
        ├─ Validate model available
        │         │
        │         └─ OpenAI API lists model? ✓
        │
        ├─ Persist to config.json
        │         │
        │         └─ {"chat_provider": "openai", ...}
        │
        └─ Clear ALL caches (triggered automatically)
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    reset_    reset_      reset_
    chat_     embedding_  vectorstore_
    client_   cache()     cache()
    cache()
        │         │         │
        ▼         ▼         ▼
    _ollama_  _ollama_    All Chroma
    _chat_    _client     instances
    _client   cleared     cleared
    cleared   
    
    AND
    
    _openai_
    _chat_
    _client
    cleared
        │
        └─────────────────┬────────────────────┘
                          │
New State Active:
┌────────────────────────────────────────┐
│  OpenAI LLM (ChatOpenAI)               │
│  OpenAI Embedding (OpenAIEmbeddings)   │
│  Fresh instances created on next call  │
└────────────────────────────────────────┘

        │
        ▼
Next request triggers:
- _openai_chat_client("gpt-4") → creates ChatOpenAI
- _openai_embeddings() → creates OpenAIEmbeddings
- _vectorstore("openai", "text-embedding-3-small") → creates Chroma
        │
        ▼
User can now chat with OpenAI!
```

## Cache Architecture Visualization

```
┌──────────────────────────────────────────────────────────────┐
│                    LRU Cache Strategy                        │
├──────────────────────────────────────────────────────────────┤

LLM Client Cache (4 slots):
┌────────────────────────────────────┐
│ @lru_cache(maxsize=4)              │
│                                    │
│ _ollama_chat_client(model):        │
│   ["gemma3:4b"] ────┐              │
│   ["mistral"]   ─┐  │              │
│   ["neural"]  ─┐│  │              │
│                ││  │              │
│   Slot 4 ───> (new client)        │
│                ││  │              │
│                └┼──┘              │
│                 └────────────────┘
│                                    │
│ _openai_chat_client(model):        │
│   ["gpt-4"] ────┐                  │
│   ["gpt-3.5"] ─┐│                  │
│                ││                  │
│   Slot 3 ───> (new client)        │
│                │                   │
│                └───────────────────┘
└────────────────────────────────────┘

Embedding Cache (1 each):
┌────────────────────────────────────┐
│ @lru_cache(maxsize=1)              │
│                                    │
│ _ollama_client():                  │
│   [ollama.Client instance]         │
│   (shared across all models)       │
│                                    │
│ _openai_embeddings():              │
│   [OpenAIEmbeddings("model")]      │
│   (stores model internally)        │
└────────────────────────────────────┘

Vector Store Cache (4 slots):
┌──────────────────────────────────────────┐
│ @lru_cache(maxsize=4)                    │
│                                          │
│ _vectorstore(provider, model):           │
│   ("ollama", "embeddinggemma:latest")    │
│   ("ollama", "nomic-embed-text")         │
│   ("openai", "text-embedding-3-small")   │
│   ("openai", "text-embedding-3-large")   │
│                                          │
│   Chroma instances (4 independent)       │
└──────────────────────────────────────────┘

Cache Key Format:
  function_name + (arg1, arg2, ...)
  
  Example:
  _vectorstore("openai", "text-embedding-3-small")
  └─ Key: ("openai", "text-embedding-3-small")
```

## Endpoint Hierarchy

```
/api/v1
├── /providers
│   ├── /llm
│   │   ├── GET          → List LLM providers
│   │   └── /{key}/models
│   │       └── GET      → List models for LLM provider
│   │
│   ├── /embedding
│   │   ├── GET          → List embedding providers
│   │   └── /{key}/models
│   │       └── GET      → List models for embedding provider
│   │
│   ├── /selection
│   │   ├── GET          → Get current selection
│   │   └── POST         → Update selection (clears caches)
│   │
│   └── /rag
│       ├── /options
│       │   └── GET      → Get RAG configuration options
│       ├── /selection
│       │   ├── GET      → Get current RAG selection
│       │   └── POST     → Update RAG selection
│       └── /reset
│           └── POST     → Reset RAG to defaults
│
├── /query
│   └── /chat
│       └── POST         → Generate answer (uses selected providers)
│
├── /files
│   ├── /upload
│   │   └── POST         → Upload & index file (uses selected embedding)
│   └── /{id}/delete
│       └── DELETE       → Delete file & vectors
│
└── /system
    └── /health
        └── GET          → Health check
```

## Error Handling Flow

```
User Action
    │
    ▼
API Endpoint
    │
    ├─ Missing API Key?
    │         │
    │         └─► 400 Bad Request
    │             "OpenAI API key not configured"
    │
    ├─ Invalid Provider?
    │         │
    │         └─► 400 Bad Request
    │             "Provider 'anthropic' is not available"
    │
    ├─ Invalid Model?
    │         │
    │         └─► 400 Bad Request
    │             "Model 'gpt-999' not found for provider"
    │
    ├─ API Unreachable?
    │         │
    │         └─► 502 Bad Gateway
    │             "Failed to list OpenAI models: connection error"
    │
    ├─ Generation Failed?
    │         │
    │         └─► 502 Bad Gateway
    │             "Generation failed while contacting the model"
    │
    └─ Success!
              │
              ▼
         200 OK with data
```

---

This visual guide shows the complete architecture of the multi-provider system!
