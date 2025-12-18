# API Reference: Multi-Provider Endpoints

All endpoints for provider management and configuration are available at `/providers/*` endpoints.

## LLM Provider Endpoints

### Get Available LLM Providers
```
GET /providers/llm
```
**Response**:
```json
{
  "providers": [
    {
      "key": "ollama",
      "label": "Ollama",
      "type": "llm"
    },
    {
      "key": "openai",
      "label": "OpenAI",
      "type": "llm"
    }
  ]
}
```

**Notes**:
- OpenAI only appears if `langchain_openai` and `openai` packages are installed
- Providers are sorted by availability (available providers first)

---

### Get Models for LLM Provider
```
GET /providers/llm/{provider_key}/models
```

**Example**: `GET /providers/llm/openai/models`

**Response**:
```json
{
  "provider": "openai",
  "type": "llm",
  "models": [
    {
      "id": "gpt-4",
      "label": "gpt-4",
      "context_length": 8192
    },
    {
      "id": "gpt-3.5-turbo",
      "label": "gpt-3.5-turbo",
      "context_length": 4096
    }
  ]
}
```

**Error**:
- `404`: Provider not found
- `502`: API failure (e.g., invalid OpenAI key)

---

## Embedding Provider Endpoints

### Get Available Embedding Providers
```
GET /providers/embedding
```
**Response**:
```json
{
  "providers": [
    {
      "key": "ollama",
      "label": "Ollama",
      "type": "embedding"
    },
    {
      "key": "openai",
      "label": "OpenAI",
      "type": "embedding"
    }
  ]
}
```

---

### Get Models for Embedding Provider
```
GET /providers/embedding/{provider_key}/models
```

**Example**: `GET /providers/embedding/openai/models`

**Response**:
```json
{
  "provider": "openai",
  "type": "embedding",
  "models": [
    {
      "id": "text-embedding-3-large",
      "label": "text-embedding-3-large",
      "context_length": 8191
    },
    {
      "id": "text-embedding-3-small",
      "label": "text-embedding-3-small",
      "context_length": 8191
    },
    {
      "id": "text-embedding-ada-002",
      "label": "text-embedding-ada-002",
      "context_length": 8191
    }
  ]
}
```

---

## Provider Selection Endpoints

### Get Current Selection
```
GET /providers/selection
```

**Response**:
```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4"
  },
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small"
  }
}
```

---

### Update Provider Selection
```
POST /providers/selection
Content-Type: application/json
```

**Request Body**:
```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4"
  },
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small"
  }
}
```

**Response**: Same as GET /providers/selection

**Errors**:
- `400`: Invalid provider or model
- `502`: Provider/model validation failed

**Side Effects**:
- Clears LLM client cache
- Clears embedding client cache
- Clears vector store cache
- Persists selection to `backend/storage/runtime_config.json`

---

## RAG Configuration Endpoints

### Get RAG Options
```
GET /providers/rag/options
```

**Response**:
```json
{
  "retrieval_strategies": ["similarity", "similarity_score_threshold", "mmr"],
  "vector_backends": [
    {
      "key": "chroma",
      "label": "Chroma"
    }
  ],
  "chunking_methods": [
    "recursive_character",
    "character",
    "token",
    "markdown_header",
    "nltk",
    "spacy"
  ],
  "defaults": {
    "retrieval_strategy": "similarity",
    "top_k": 5,
    "vector_backend": "chroma"
  }
}
```

---

### Get Current RAG Selection
```
GET /providers/rag/selection
```

**Response**:
```json
{
  "selection": {
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

---

### Update RAG Selection
```
POST /providers/rag/selection
Content-Type: application/json
```

**Request Body**:
```json
{
  "selection": {
    "retrieval_strategy": "mmr",
    "top_k": 10,
    "score_threshold": null,
    "fetch_k": 20,
    "lambda_mult": 0.5,
    "chunking_method": "recursive_character",
    "vector_backend": "chroma"
  }
}
```

**Response**: Same as GET /providers/rag/selection

**Errors**:
- `400`: Invalid configuration

**Side Effects**:
- Clears vector store cache
- Persists configuration

---

### Reset RAG to Defaults
```
POST /providers/rag/reset
```

**Response**: Same as GET /providers/rag/selection

**Side Effects**:
- Reverts to default RAG configuration
- Clears vector store cache

---

## Integration Example: Frontend Flow

```javascript
// 1. Load available providers
const llmProvidersRes = await fetch('/providers/llm');
const llmProviders = await llmProvidersRes.json();

// 2. Load models for selected provider
const modelsRes = await fetch('/providers/llm/openai/models');
const models = await modelsRes.json();

// 3. Get current selection
const selectionRes = await fetch('/providers/selection');
const currentSelection = await selectionRes.json();

// 4. Update selection
const updateRes = await fetch('/providers/selection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    llm: { provider: 'openai', model: 'gpt-4' },
    embedding: { provider: 'openai', model: 'text-embedding-3-small' }
  })
});
const updated = await updateRes.json();
```

---

## Error Codes

| Code | Meaning     | Common Cause                                        |
| ---- | ----------- | --------------------------------------------------- |
| 200  | Success     | Request processed correctly                         |
| 400  | Bad Request | Invalid provider/model, validation failed           |
| 404  | Not Found   | Provider key not recognized                         |
| 502  | Bad Gateway | API failure (e.g., OpenAI unreachable, invalid key) |

---

## Provider Availability

### OpenAI Provider
- **Requires**: `langchain-openai` and `openai` packages installed
- **Requires**: `RAG_OPENAI_API_KEY` environment variable set
- **Available**: Only shows if both requirements met

### Ollama Provider
- **Requires**: `ollama` SDK package installed
- **Requires**: Ollama running at `RAG_OLLAMA_BASE_URL` (default: http://localhost:11434)
- **Available**: Only if Ollama SDK can connect

---

## Best Practices

1. **Always check availability first**: Call `/providers/llm` before assuming OpenAI is available
2. **Handle 502 errors**: May occur if API is unavailable or credentials invalid
3. **Re-upload when switching embeddings**: Different models require re-indexing
4. **Cache provider lists**: Don't call these endpoints on every render
5. **Show loading states**: Model discovery can take a few seconds

---

## Troubleshooting

### OpenAI provider not showing
- Check: `langchain-openai` package installed? `pip list | grep langchain-openai`
- Check: `RAG_OPENAI_API_KEY` environment variable set? `echo $RAG_OPENAI_API_KEY`
- Check: API key is valid (try listing models via API)

### Getting 502 when calling models endpoint
- OpenAI API key is invalid or expired
- Network connection issue
- Rate limited by OpenAI

### Getting 400 on selection update
- Selected provider is not available (not installed or API key missing)
- Selected model doesn't exist for that provider
