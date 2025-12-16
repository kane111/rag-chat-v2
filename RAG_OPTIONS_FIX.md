# RAG Options Fix Summary

## Problem
The RAG options configured on the frontend (retrieval strategy, top_k, score threshold, fetch_k, lambda_mult, chunking method, vector backend) were not being used during query processing and file ingestion. The system was using hardcoded defaults instead of the saved runtime configuration.

## Root Cause
1. **Query Endpoint**: The `/query` endpoint was accepting `top_k` from the request body but ignoring the RAG runtime configuration
2. **File Ingestion**: The `/ingest` and `/file/{id}` endpoints were using hardcoded default chunking methods instead of the runtime RAG config
3. **Frontend**: The frontend was correctly saving RAG options but not sending them with queries (which is correct since they should be server-side configuration)

## Changes Made

### 1. Backend Query Endpoint (`backend/routers/query.py`)
**Before:**
```python
@router.post("/query")
def query(req: QueryRequest, db: Session = Depends(get_db)):
    top_k = req.top_k or settings.top_k
    logger.info("query: top_k=%s stream=true", top_k)
```

**After:**
```python
@router.post("/query")
def query(req: QueryRequest, db: Session = Depends(get_db)):
    # Use RAG settings from runtime config instead of request
    from ..services.runtime_config import get_runtime_rag
    rag_config = get_runtime_rag()
    top_k = rag_config["top_k"]
    logger.info("query: top_k=%s (from RAG config) stream=true", top_k)
```

**Impact:** Queries now use the configured `top_k` value from the RAG settings instead of a hardcoded default or request parameter.

### 2. Backend Query Schema (`backend/schemas.py`)
**Before:**
```python
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)
    stream: bool = False
```

**After:**
```python
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    stream: bool = False
```

**Impact:** Removed `top_k` from the request schema since it should come from runtime configuration, not from the client request.

### 3. Backend File Ingestion (`backend/routers/files.py`)
**Before:**
```python
@router.post("/ingest", response_model=IngestResponse)
def ingest(
    file: UploadFile = File(...),
    chunking_method: str = Form(default="recursive_character"),
    db: Session = Depends(get_db)
):
    logger.info("ingest: filename=%s, chunking_method=%s", file.filename, chunking_method)
    # Validate and convert chunking_method string to enum
    try:
        method = ChunkingMethod(chunking_method)
    except ValueError:
        method = ChunkingMethod.RECURSIVE_CHARACTER
```

**After:**
```python
@router.post("/ingest", response_model=IngestResponse)
def ingest(
    file: UploadFile = File(...),
    chunking_method: str = Form(default=""),
    db: Session = Depends(get_db)
):
    # Use runtime RAG config if chunking_method not provided
    from ..services.runtime_config import get_runtime_rag
    
    if not chunking_method:
        rag_config = get_runtime_rag()
        chunking_method = rag_config.get("chunking_method") or "recursive_character"
    
    logger.info("ingest: filename=%s, chunking_method=%s", file.filename, chunking_method)
    # Validate and convert chunking_method string to enum
    try:
        method = ChunkingMethod(chunking_method)
    except ValueError:
        method = ChunkingMethod.RECURSIVE_CHARACTER
```

**Impact:** File ingestion now uses the configured chunking method from RAG settings when no explicit method is provided.

### 4. Backend File Update Endpoint (`backend/routers/files.py`)
Similar changes to the `/file/{file_id}` PUT endpoint to use runtime RAG config for chunking method.

## How It Works Now

### RAG Configuration Flow
1. User sets RAG options in the `/config` page (retrieval strategy, top_k, thresholds, chunking method, etc.)
2. Options are saved to `backend/storage/runtime_config.json` via the `/providers/rag/selection` endpoint
3. The backend reads this configuration when processing queries and ingesting files

### Query Processing Flow
1. Frontend sends query to `/query` endpoint with just `query` text and `stream` flag
2. Backend loads RAG config from `runtime_config.json` using `get_runtime_rag()`
3. Backend uses configured `top_k`, `retrieval_strategy`, and other options
4. The `retrieve()` function in `rag_store.py` applies the full RAG configuration:
   - **similarity**: Standard scored similarity search
   - **similarity_score_threshold**: Filters results by minimum relevance score
   - **mmr**: Uses maximal marginal relevance with configured `fetch_k` and `lambda_mult`

### File Ingestion Flow
1. Frontend uploads file to `/ingest` endpoint
2. Backend checks if explicit chunking method was provided
3. If not provided, backend loads RAG config and uses the configured `chunking_method`
4. File is processed and chunked using the selected method
5. Chunks are stored in database and vector store

## Testing
To verify the fix works:

1. **Set RAG Options:**
   - Go to `/config` page
   - Change retrieval strategy (e.g., to "mmr")
   - Adjust top_k (e.g., to 10)
   - Save configuration

2. **Test Query:**
   - Upload a document
   - Ask a question
   - Check backend logs - should show: `query: top_k=10 (from RAG config) stream=true`
   - Results should reflect the configured strategy

3. **Test Chunking:**
   - Set chunking method to "markdown_header"
   - Upload a new markdown file
   - Check backend logs - should show the configured chunking method
   - Chunks should be split according to markdown headers

## Files Modified
- `backend/routers/query.py` - Use runtime RAG config for top_k
- `backend/routers/files.py` - Use runtime RAG config for chunking method
- `backend/schemas.py` - Remove top_k from QueryRequest

## Files Already Working Correctly
- `backend/services/rag_store.py` - Already implements all retrieval strategies correctly
- `backend/services/runtime_config.py` - Already manages RAG configuration correctly
- `app/components/RAGConfigSection.tsx` - Already saves RAG options correctly
- `app/hooks/useChatQuery.ts` - Already sends queries correctly (without RAG params)

## Notes
- The vector store cache is automatically cleared when RAG settings change (see `reset_vectorstore_cache()` calls in `runtime_config.py`)
- All RAG options are server-side configuration, not client-side, which is the correct architecture
- The chunking method affects only new file uploads; existing files retain their original chunking
