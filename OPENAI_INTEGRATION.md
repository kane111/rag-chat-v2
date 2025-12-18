# OpenAI Integration

This document describes the multi-provider architecture that has been implemented to support switching between **Ollama** and **OpenAI** for both LLM generation and embeddings.

## Overview

The system now supports:
- **LLM Providers**: Ollama, OpenAI
- **Embedding Providers**: Ollama, OpenAI
- **Independent Selection**: LLM and embedding providers can be selected independently

## Architecture

### Backend Changes

#### 1. **Configuration** (`backend/config.py`)
- Added `openai_api_key` setting for storing the OpenAI API key
- Environment variable: `RAG_OPENAI_API_KEY`

#### 2. **Provider Registry** (`backend/services/providers.py`)
Already existed with support for:
- Detecting available providers based on installed packages
- Listing models from each provider via APIs
- Validation of provider and model availability

#### 3. **LLM Generation** (`backend/services/generation.py`)
- **Multi-provider Architecture**:
  - `_ollama_chat_client()`: Caches ChatOllama instances per model
  - `_openai_chat_client()`: Caches ChatOpenAI instances per model
  - `_get_chat()`: Returns the appropriate client based on runtime config
  
- Uses LangChain abstractions:
  - `langchain_ollama.ChatOllama` for Ollama
  - `langchain_openai.ChatOpenAI` for OpenAI
  - Both inherit from `langchain_core.language_models.BaseChatModel`

#### 4. **Embeddings** (`backend/services/embedding.py`)
- **Multi-provider Architecture**:
  - `_ollama_client()`: Creates ollama.Client for Ollama embeddings
  - `_openai_embeddings()`: Creates OpenAIEmbeddings for OpenAI
  - `embed_text()`: Routes to the correct provider

- Uses LangChain abstractions:
  - `langchain_ollama.OllamaEmbeddings` (cached in rag_store.py)
  - `langchain_openai.OpenAIEmbeddings`

#### 5. **Vector Store** (`backend/services/rag_store.py`)
- Updated to support both embedding providers
- `_get_embedding_client()`: Returns embedding client based on provider + model
- Chroma vector store uses the selected embedding provider
- Cache keys include both provider and model for proper isolation

#### 6. **Runtime Configuration** (`backend/services/runtime_config.py`)
- Added `reset_embedding_cache()` call to cache invalidation
- Cache reset includes:
  - `reset_chat_client_cache()`
  - `reset_embedding_cache()`
  - `reset_vectorstore_cache()`

### Frontend (Unchanged - Full Compatibility)

The configuration UI at `/config` already supports provider switching:
- **LLM Provider Configuration** section: Dropdown to select provider + radio buttons for models
- **Embedding Provider Configuration** section: Dropdown to select provider + radio buttons for models
- **Save/Apply**: Changes are persisted and applied immediately
- **Status**: Shows loading, errors, and success states

## Usage

### Setup

1. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Configure OpenAI** (if using OpenAI):
   ```bash
   export RAG_OPENAI_API_KEY="your-api-key-here"
   ```

3. **Start the application**:
   ```bash
   # Backend
   cd backend
   uvicorn main:app --reload
   
   # Frontend (in another terminal)
   npm run dev
   ```

### Switching Providers

1. Navigate to `http://localhost:3000/config`
2. In **LLM Provider Configuration**:
   - Select provider (Ollama or OpenAI)
   - Choose a model from the available list
3. In **Embedding Provider Configuration**:
   - Select provider (Ollama or OpenAI)
   - Choose a model from the available list
4. Click **Save selection**
5. The system will automatically reset caches and apply the new configuration

## Dependencies Added

```
langchain-openai==0.1.20
openai==1.56.2
```

## Important Notes

### API Key Management
- OpenAI API key is configured via `RAG_OPENAI_API_KEY` environment variable
- If not set, OpenAI provider will show as unavailable in the UI
- The API key is NOT stored in configuration files; only the selected provider/model names are persisted

### Cache Invalidation
- When providers are switched, all relevant caches are cleared
- This includes:
  - LLM client cache (ChatOllama/ChatOpenAI)
  - Embedding client cache (OllamaEmbeddings/OpenAIEmbeddings)
  - Vector store cache (Chroma instances)

### Vector Store Considerations
- **Chroma persists vectors to disk** in `backend/storage/chroma`
- When switching embedding providers, vectors must be **re-indexed** (re-upload files)
- This is because different embedding models produce different vector spaces
- The system will automatically use the correct embedding provider for new uploads

### Model Availability
- Available models are fetched dynamically from each provider's API
- Model lists are displayed with context length (token count) when available
- For OpenAI, requires valid API credentials to list models

## Testing

### Test LLM Provider Switching
1. Start with Ollama (default)
2. Go to `/config`
3. Switch LLM to OpenAI
4. Ask a question in the chat
5. Verify response is from OpenAI

### Test Embedding Provider Switching
1. Start with Ollama embedding (default)
2. **Upload a file** (vectors are indexed with Ollama)
3. Switch embedding provider to OpenAI
4. **Re-upload the same file** (vectors are re-indexed with OpenAI)
5. Verify search results are consistent

## Rollback

To roll back to Ollama-only:
1. Remove langchain_openai and openai from requirements.txt
2. Revert the modified files
3. Reinstall dependencies

## Future Enhancements

- Support for additional providers (Anthropic, Cohere, etc.)
- Provider-specific configuration (temperature, top-p, etc.)
- Batch model switching for multiple files
- Provider usage analytics/metrics
