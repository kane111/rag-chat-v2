# API Integration Guide

## Overview

This document describes the RESTful API endpoints provided by the RAG Chat v2 backend. The API enables file management, querying, and provider configuration.

**Base URL**: `http://localhost:8000` (development)

---

## File Management Endpoints

### POST `/ingest`

Upload and process a new file.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: File to upload (PDF, DOCX, or TXT)
  - `chunking_method` (optional): `recursive_character`, `markdown`, or `token_based`

**Response** (200 OK):
```json
{
  "file": {
    "id": 1,
    "filename": "document.pdf",
    "filepath": "/storage/files/document.pdf",
    "filetype": "pdf",
    "size_mb": 2.5,
    "uploaded_at": "2024-12-16T10:30:00",
    "updated_at": "2024-12-16T10:30:00",
    "converted_with_docling": true,
    "deleted": false
  },
  "chunks": 42,
  "raw_markdown": "# Document Title\n\nContent..."
}
```

**Example (curl)**:
```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/document.pdf" \
  -F "chunking_method=recursive_character"
```

---

### GET `/files`

List all uploaded files.

**Request**:
- Method: `GET`

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "filename": "document.pdf",
    "filepath": "/storage/files/document.pdf",
    "filetype": "pdf",
    "size_mb": 2.5,
    "uploaded_at": "2024-12-16T10:30:00",
    "updated_at": "2024-12-16T10:30:00",
    "converted_with_docling": true,
    "deleted": false
  }
]
```

**Example (curl)**:
```bash
curl http://localhost:8000/files
```

---

### GET `/file/{file_id}/chunks`

Get all chunks for a specific file.

**Request**:
- Method: `GET`
- Path Parameters:
  - `file_id`: ID of the file

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "file_id": 1,
    "chunk_index": 0,
    "content": "Chapter text...",
    "section_heading": "Introduction",
    "page_number": 1,
    "created_at": "2024-12-16T10:30:00"
  }
]
```

**Example (curl)**:
```bash
curl http://localhost:8000/file/1/chunks
```

---

### GET `/file/{file_id}/questions`

Get suggested questions for a file.

**Request**:
- Method: `GET`
- Path Parameters:
  - `file_id`: ID of the file

**Response** (200 OK):
```json
{
  "file_id": 1,
  "filename": "document.pdf",
  "questions": [
    "What is the main topic?",
    "Who is the author?"
  ]
}
```

**Example (curl)**:
```bash
curl http://localhost:8000/file/1/questions
```

---

### PUT `/file/{file_id}`

Re-ingest (update) an existing file with new content.

**Request**:
- Method: `PUT`
- Path Parameters:
  - `file_id`: ID of the file to update
- Content-Type: `multipart/form-data`
- Body:
  - `file`: New file content
  - `chunking_method` (optional): Chunking strategy

**Response** (200 OK):
```json
{
  "file": {
    "id": 1,
    "filename": "document.pdf",
    ...
  },
  "chunks": 45,
  "raw_markdown": "..."
}
```

**Example (curl)**:
```bash
curl -X PUT http://localhost:8000/file/1 \
  -F "file=@/path/to/updated-document.pdf"
```

---

### DELETE `/file/{file_id}`

Delete a file and all its chunks.

**Request**:
- Method: `DELETE`
- Path Parameters:
  - `file_id`: ID of the file to delete

**Response** (200 OK):
```json
{
  "status": "deleted"
}
```

**Example (curl)**:
```bash
curl -X DELETE http://localhost:8000/file/1
```

---

## Query Endpoints

### POST `/query`

Submit a query and receive a streaming response.

**Request**:
- Method: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "query": "What is mentioned about machine learning?",
  "file_ids": [1, 2]
}
```

**Response** (200 OK, Server-Sent Events):

The response uses Server-Sent Events (SSE) format:

```
event: context
data: [{"chunk": "...", "citation": {"doc_id": 1, "filename": "doc.pdf", "page": 1, "section": "Introduction"}}]

event: message
data: Machine learning is...

event: message
data:  a field of study...

event: end
data: 
```

**Event Types**:
- `context`: Retrieved context chunks (sent first)
- `message`: Streaming answer text (sent multiple times)
- `end`: End of stream
- `error`: Error occurred

**Example (curl)**:
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is machine learning?", "file_ids": [1]}'
```

**Example (JavaScript)**:
```javascript
const eventSource = new EventSource('/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'What is ML?', file_ids: [1] })
});

eventSource.addEventListener('context', (e) => {
  const chunks = JSON.parse(e.data);
  console.log('Context:', chunks);
});

eventSource.addEventListener('message', (e) => {
  console.log('Answer chunk:', e.data);
});

eventSource.addEventListener('end', () => {
  eventSource.close();
});
```

---

## Provider Management Endpoints

### GET `/providers/llm`

List available LLM providers.

**Response** (200 OK):
```json
{
  "providers": [
    {
      "key": "ollama",
      "name": "Ollama",
      "description": "Local LLM provider",
      "status": "available"
    }
  ]
}
```

---

### GET `/providers/embedding`

List available embedding providers.

**Response** (200 OK):
```json
{
  "providers": [
    {
      "key": "ollama",
      "name": "Ollama",
      "description": "Local embedding provider",
      "status": "available"
    }
  ]
}
```

---

### GET `/providers/llm/{provider_key}/models`

List models for a specific LLM provider.

**Response** (200 OK):
```json
{
  "provider": "ollama",
  "type": "llm",
  "models": [
    {
      "key": "gemma3:4b",
      "name": "Gemma 3 4B",
      "description": "Fast and efficient 4B parameter model"
    }
  ]
}
```

---

### GET `/providers/embedding/{provider_key}/models`

List models for a specific embedding provider.

**Response** (200 OK):
```json
{
  "provider": "ollama",
  "type": "embedding",
  "models": [
    {
      "key": "embeddinggemma:latest",
      "name": "Embedding Gemma",
      "description": "Gemma embedding model"
    }
  ]
}
```

---

### GET `/providers/selection`

Get current provider and model selection.

**Response** (200 OK):
```json
{
  "llm": {
    "provider": "ollama",
    "model": "gemma3:4b"
  },
  "embedding": {
    "provider": "ollama",
    "model": "embeddinggemma:latest"
  }
}
```

---

### POST `/providers/selection`

Update provider and model selection.

**Request**:
```json
{
  "llm": {
    "provider": "ollama",
    "model": "gemma3:4b"
  },
  "embedding": {
    "provider": "ollama",
    "model": "embeddinggemma:latest"
  }
}
```

**Response** (200 OK):
```json
{
  "llm": {
    "provider": "ollama",
    "model": "gemma3:4b"
  },
  "embedding": {
    "provider": "ollama",
    "model": "embeddinggemma:latest"
  }
}
```

---

### GET `/providers/rag`

Get available RAG options (strategies, backends, etc.).

**Response** (200 OK):
```json
{
  "strategies": [
    {
      "key": "similarity",
      "name": "Similarity Search",
      "description": "Basic cosine similarity search"
    },
    {
      "key": "similarity_threshold",
      "name": "Similarity with Threshold",
      "description": "Filter by minimum score"
    },
    {
      "key": "mmr",
      "name": "MMR (Maximal Marginal Relevance)",
      "description": "Balance relevance and diversity"
    }
  ],
  "backends": ["chroma"],
  "chunking_methods": [
    {
      "key": "recursive_character",
      "name": "Recursive Character",
      "description": "Split by characters with overlap"
    },
    {
      "key": "markdown",
      "name": "Markdown Headers",
      "description": "Split by markdown structure"
    }
  ]
}
```

---

### GET `/providers/rag/selection`

Get current RAG configuration.

**Response** (200 OK):
```json
{
  "selection": {
    "strategy": "mmr",
    "backend": "chroma",
    "top_k": 12,
    "score_threshold": 0.4,
    "mmr_lambda": 0.5,
    "chunking_method": "recursive_character"
  }
}
```

---

### POST `/providers/rag/selection`

Update RAG configuration.

**Request**:
```json
{
  "strategy": "mmr",
  "backend": "chroma",
  "top_k": 15,
  "score_threshold": 0.3,
  "mmr_lambda": 0.7,
  "chunking_method": "markdown"
}
```

**Response** (200 OK):
```json
{
  "selection": {
    "strategy": "mmr",
    "backend": "chroma",
    "top_k": 15,
    "score_threshold": 0.3,
    "mmr_lambda": 0.7,
    "chunking_method": "markdown"
  }
}
```

---

### POST `/providers/rag/reset`

Reset RAG configuration to defaults.

**Response** (200 OK):
```json
{
  "selection": {
    "strategy": "similarity",
    "backend": "chroma",
    "top_k": 12,
    "score_threshold": 0.0,
    "mmr_lambda": 0.5,
    "chunking_method": "recursive_character"
  }
}
```

---

## System Endpoints

### GET `/health`

Health check endpoint.

**Response** (200 OK):
```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "code": "INVALID_REQUEST",
  "message": "Invalid file format. Supported: PDF, DOCX, TXT",
  "correlation_id": "uuid-here"
}
```

### 404 Not Found
```json
{
  "code": "NOT_FOUND",
  "message": "File not found",
  "correlation_id": "uuid-here"
}
```

### 500 Internal Server Error
```json
{
  "code": "SERVER_ERROR",
  "message": "An unexpected error occurred",
  "correlation_id": "uuid-here"
}
```

---

## Configuration

### CORS

The backend supports CORS for frontend integration. Configure allowed origins:

```bash
RAG_allowed_origins=http://localhost:3000,http://127.0.0.1:3000
```

### API Base URL

Frontend can override the API base URL:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting for production deployments.

---

## Authentication

Currently, there is no authentication implemented. This API is intended for local/internal use. For production, implement authentication and authorization.

---

## Best Practices

### 1. File Upload
- Check file size before upload (max 50MB by default)
- Validate file type on client side
- Show progress during upload
- Handle errors gracefully

### 2. Query Streaming
- Use EventSource or fetch with streaming
- Handle connection errors
- Display context before answer
- Close connection on error

### 3. Error Handling
- Log `correlation_id` for debugging
- Display user-friendly error messages
- Retry on network errors (not on 4xx)
- Check backend logs for details

---

## Testing

### Using curl

Test all endpoints with curl:

```bash
# Upload file
curl -X POST http://localhost:8000/ingest -F "file=@test.pdf"

# List files
curl http://localhost:8000/files

# Query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'

# Get providers
curl http://localhost:8000/providers/llm
```

### Using Python

```python
import requests

# Upload file
with open('test.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/ingest',
        files={'file': f}
    )
    print(response.json())

# Query
response = requests.post(
    'http://localhost:8000/query',
    json={'query': 'What is this about?'}
)
for line in response.iter_lines():
    print(line.decode('utf-8'))
```

---

## OpenAPI Documentation

The API includes auto-generated OpenAPI documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## Changelog

### v0.1.0 (Current)
- File management (upload, list, delete, update)
- Streaming query with SSE
- Provider and model selection
- RAG configuration
- Chunking strategies

---

For more information, see:
- [README.md](README.md) - Project overview
- [GETTING_STARTED.md](GETTING_STARTED.md) - Setup guide
- [USER_GUIDE.md](USER_GUIDE.md) - User documentation
