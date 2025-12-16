# Fixed: LLM Rendered Result Not Returned from /query Endpoint

## Problem
The `/query` endpoint was returning empty results or "I don't know based on the provided documents" even though documents were uploaded and indexed in the system.

## Root Cause
The RAG system was configured to use the `similarity_score_threshold` retrieval strategy with a threshold of `0.5`. However:

1. The embedding model (`embeddinggemma:latest`) was returning similarity scores that:
   - Were outside the valid 0-1 range (some negative, some > 1)
   - All fell below the 0.5 threshold
   
2. This caused the `similarity_search_with_relevance_scores()` method to return zero results
3. With no context, the LLM would output the fallback message instead of generating an answer

## Solution
Made two changes to fix the issue:

### 1. Updated Retrieval Strategy (runtime_config.json)
Changed from `similarity_score_threshold` with a high threshold to basic `similarity` search:

```json
// Before
"retrieval_strategy": "similarity_score_threshold",
"score_threshold": 0.5,

// After
"retrieval_strategy": "similarity",
"score_threshold": null,
```

### 2. Improved Threshold Handling (backend/services/rag_store.py)
Modified the `retrieve()` function to properly handle threshold-based filtering:

```python
def retrieve(query: str, k: int):
    """Retrieve documents using configured strategy."""
    vs = get_vectorstore()
    rag = get_runtime_rag()
    stype = rag["retrieval_strategy"]
    
    if stype == "similarity":
        return vs.similarity_search_with_score(query, k=k)
    
    if stype == "similarity_score_threshold":
        # Use similarity search as fallback for threshold strategy
        # The relevance_scores method can produce invalid scores outside 0-1 range
        threshold = rag.get("score_threshold") or 0.0
        results = vs.similarity_search_with_score(query, k=k * 2)  # Get more to filter
        filtered = [(doc, score) for doc, score in results if score >= threshold]
        return filtered[:k]
    
    # ... other strategies ...
```

## Verification
After the fix:
- ✅ Chunks are successfully retrieved from the vector store
- ✅ Context is properly passed to the LLM  
- ✅ LLM generates meaningful responses based on the documents
- ✅ Streaming response works correctly via Server-Sent Events
- ✅ HTTP 200 status with proper `text/event-stream` content type

## Files Modified
1. `backend/storage/runtime_config.json` - Changed retrieval strategy
2. `backend/services/rag_store.py` - Improved threshold handling

The backend is now properly returning LLM-rendered results when querying the documents.
