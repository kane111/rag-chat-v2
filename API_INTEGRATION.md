# Backend API Integration Guide

## Overview

This document describes the expected API endpoints and their integration with the frontend UX components.

## Current API Endpoints Used

### File Management

#### GET `/files`
Fetches all uploaded files with metadata.

**Response**:
```json
[
  {
    "id": 1,
    "filename": "document.pdf",
    "filepath": "/storage/files/document.pdf",
    "filetype": "pdf",
    "size_mb": 2.5,
    "uploaded_at": "2024-12-13T10:30:00",
    "updated_at": "2024-12-13T10:30:00",
    "converted_with_docling": true
  }
]
```

**UI Integration**: 
- Displays in file list sidebar
- Shows in `FileListItem` component
- Used by modal for confirmation

#### POST `/ingest`
Uploads and processes a file.

**Request**:
- Content-Type: `multipart/form-data`
- Field: `file` (File object)

**Response**:
```json
{
  "id": 1,
  "filename": "document.pdf",
  "status": "completed"
}
```

**UI Integration**:
- Triggered by `FileUploadZone` component
- Shows progress bar during upload
- Toast on success/error
- Refreshes file list on completion

#### DELETE `/file/{id}`
Deletes a file and all associated chunks.

**Response**: `204 No Content` or error

**UI Integration**:
- Triggered from `FileListItem` delete button
- Shows confirmation modal
- Toast on success
- Refreshes file list

#### GET `/file/{id}/chunks`
Fetches all chunks for a file.

**Response**:
```json
[
  {
    "id": 1,
    "file_id": 1,
    "chunk_index": 0,
    "content": "Chapter text...",
    "section_heading": "Introduction",
    "page_number": 1,
    "created_at": "2024-12-13T10:30:00"
  }
]
```

**UI Integration**:
- Triggered by "Show Chunks" button
- Displays in expandable section
- Shows chunk count badge

#### GET `/file/{id}/questions`
Fetches suggested questions for a file.

**Response**:
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

**UI Integration**:
- Triggered by "Show Questions" button
- Displays as clickable buttons
- Sets query when clicked

### Chat & Query

#### POST `/query`
Submits a query and receives answer with context.

**Request**:
```json
{
  "query": "What is mentioned about X?",
  "conversation_id": null,
  "stream": true
}
```

**Streaming Response** (SSE format):
```
event: context
data: [{"chunk": "...", "citation": {...}}]

event: message
data: text content

event: message
data: more content

event: end
data: ""
```

**UI Integration**:
- Triggered by "Send" button
- Shows typing indicator while streaming
- Displays answer in real-time
- Shows context chunks as received
- Toast on error

### Conversation Management

#### GET `/conversations`
Fetches all conversations.

**Response**:
```json
[
  {
    "id": 1,
    "title": "Document Analysis",
    "started_at": "2024-12-13T10:30:00",
    "ended_at": null
  }
]
```

**UI Integration**:
- Populates conversation history sidebar
- Shows in dropdown selector
- Highlights active conversation

#### POST `/conversation`
Creates a new conversation.

**Request**:
```json
{
  "title": "My Conversation"
}
```

**Response**:
```json
{
  "id": 2,
  "title": "My Conversation",
  "started_at": "2024-12-13T10:35:00",
  "ended_at": null
}
```

**UI Integration**:
- Triggered by "Create" button
- Validates title before submission
- Toast on success
- Refreshes conversation list
- Auto-selects new conversation

#### PATCH `/conversation/{id}`
Updates conversation title.

**Request**:
```json
{
  "title": "New Title"
}
```

**Response**:
```json
{
  "id": 1,
  "title": "New Title",
  "started_at": "2024-12-13T10:30:00",
  "ended_at": null
}
```

**UI Integration**:
- Triggered by inline rename in history
- Inline editor with Enter/Escape
- Toast on success
- Refreshes conversation list

## Expected Features for Optimal UX

### Recommended Backend Enhancements

#### 1. Conversation Rename Support
Already implemented in frontend, needs backend support:
```
PATCH /conversation/{id}
Body: { "title": "New Title" }
```

#### 2. Conversation Delete Support
Frontend component prepared for:
```
DELETE /conversation/{id}
```

#### 3. Error Response Format
For better error messages:
```json
{
  "detail": "File format not supported",
  "error_code": "UNSUPPORTED_FORMAT"
}
```

#### 4. Progress Events (Optional)
For multi-step processing:
```
event: progress
data: {"step": 1, "total": 3, "message": "Converting..."}
```

#### 5. File Metadata in List
Consider adding to file response:
```json
{
  "...": "...",
  "uploaded_by": "user@example.com",
  "tags": ["important", "review"],
  "chunk_count": 42
}
```

## Error Handling

### Expected Error Responses

#### 400 Bad Request
```json
{
  "detail": "Invalid file format. Supported: PDF, DOCX, TXT"
}
```
**UI Response**: Red error toast with message

#### 404 Not Found
```json
{
  "detail": "File not found"
}
```
**UI Response**: Error toast, refresh list

#### 413 Payload Too Large
```json
{
  "detail": "File size exceeds 100MB limit"
}
```
**UI Response**: Error toast before upload

#### 500 Server Error
```json
{
  "detail": "Internal server error"
}
```
**UI Response**: Generic error toast, log to console

## API Configuration

### Base URL
Default: `http://localhost:8000`
Can be overridden via `NEXT_PUBLIC_API_BASE` environment variable

### Headers
- **Content-Type**: `application/json` (for POST/PATCH)
- **Accept**: `text/event-stream` (for streaming queries)

### Timeouts
- Regular requests: 30 seconds
- Streaming: No timeout (keep-alive)

### Retry Logic
Frontend does NOT retry on failure. Implement in backend if needed:
- 429 (Too Many Requests): Implement rate limiting
- 503 (Service Unavailable): Return informative error

## CORS Configuration

If frontend and backend are on different origins, configure CORS:

```python
# FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing the Integration

### 1. Test File Upload
```bash
curl -X POST http://localhost:8000/ingest \
  -F "file=@/path/to/file.pdf"
```

### 2. Test Query Streaming
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Test question", "stream": true}'
```

### 3. Test Conversation Creation
```bash
curl -X POST http://localhost:8000/conversation \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
```

## Performance Considerations

### Optimize for UX

1. **File Upload**
   - Support resume/retry
   - Implement chunked upload for large files
   - Return progress events

2. **Query Streaming**
   - Send first chunk quickly (< 1s)
   - Stream context before answer
   - Use efficient token batching

3. **Conversation List**
   - Cache frequently accessed
   - Paginate if many conversations
   - Include unread count

4. **File Chunks**
   - Return paginated chunks
   - Cache in memory
   - Consider filtering by section

## Migration from Old API

If updating from previous version:

1. Ensure all endpoint paths match
2. Update response formats if changed
3. Test file upload streaming
4. Verify SSE format for queries
5. Test error responses
6. Update environment variables

## Future API Improvements

1. **Batch Operations**
   - Upload multiple files
   - Delete multiple files
   - Move files to folders

2. **Advanced Search**
   - Filter files by type/date
   - Search in content
   - Advanced queries

3. **Sharing & Permissions**
   - Share conversations
   - Share documents
   - Manage access

4. **Analytics**
   - Query usage metrics
   - Popular topics
   - User engagement

## Support & Debugging

### Common Issues

**CORS Error**: Check CORS configuration in FastAPI
**File Upload Fails**: Check file size limit and format
**Streaming Hangs**: Check backend is properly streaming SSE
**Conversation Not Saving**: Verify POST endpoint is working

### Debug Mode

Set in `.env`:
```
NEXT_PUBLIC_DEBUG=true
```

This will log all API calls and responses to console.

### Logs to Check

Frontend logs:
- Browser console (F12 → Console tab)
- Network tab (F12 → Network tab)

Backend logs:
- Uvicorn output in terminal
- Application logs in `/backend/logs/`
