# Docling Raw Markdown Output Implementation

## Overview
Added functionality to display the raw Docling markdown output in the UI when files are uploaded and converted to markdown.

## Changes Made

### Backend Changes

#### 1. **Database Model** (`backend/models.py`)
- Added `raw_markdown: Mapped[str | None]` field to the `File` model to store the raw markdown output

#### 2. **API Schemas** (`backend/schemas.py`)
- Added `raw_markdown: str | None = None` to `FileMeta` schema
- Added `raw_markdown: str | None = None` to `IngestResponse` schema

#### 3. **Conversion Service** (`backend/services/conversion.py`)
- Modified `convert_to_chunks()` to return a tuple of `(chunks, used_docling, raw_markdown)`
- Now returns the raw markdown string alongside the chunked data

#### 4. **Ingest Service** (`backend/services/ingest.py`)
- Updated `ingest_file()` to return `(file_record, chunk_count, raw_markdown)`
- Updated `reingest_file()` to return `(file_obj, chunk_count, raw_markdown)`
- Updated `_process_chunks()` to return `(chunk_count, used_docling, raw_markdown)`
- All functions now store the raw markdown in the File record's `raw_markdown` field

#### 5. **File Router** (`backend/routers/files.py`)
- Updated `/ingest` endpoint to return `raw_markdown` in the `IngestResponse`
- Updated `/file/{file_id}` PUT endpoint to return `raw_markdown` in the response

### Frontend Changes

#### 1. **New Component** (`app/components/MarkdownViewer.tsx`)
- Created standalone `MarkdownViewer` component that displays:
  - Button showing markdown statistics (lines, file size)
  - Modal with formatted markdown preview
  - Copy to clipboard functionality
  - Download as `.md` file functionality

#### 2. **Component Index** (`app/components/index.ts`)
- Exported the new `MarkdownViewer` component

#### 3. **FileListItem Component** (`app/components/FileListItem.tsx`)
- Updated `FileMeta` interface to include `raw_markdown?: string | null`
- Integrated `MarkdownViewer` component to display markdown button for files with markdown data
- Button shows line count and file size in KB

#### 4. **Main Page** (`app/page.tsx`)
- Updated `FileMeta` type to include `raw_markdown` field
- Added state for managing upload markdown display:
  - `lastUploadedMarkdown`: stores markdown content and filename
  - `showMarkdownModal`: controls modal visibility
- Updated `handleUpload()` to:
  - Capture the `raw_markdown` from API response
  - Automatically show markdown modal after successful upload
  - Display success toast with markdown info
- Added modal rendering for immediate markdown preview after upload

### User Experience

Users can now:
1. **Upload a file** → Automatically see a modal with the raw Docling markdown output
2. **Copy to Clipboard** → Quick access to the markdown for use elsewhere
3. **Download as File** → Save the markdown as a `.md` file
4. **View Later** → Click the "View Markdown" button on any file in the list to see its raw output
5. **See Statistics** → Each button shows lines and file size for quick reference

## Features

✅ Automatic display of markdown after upload
✅ Copy markdown to clipboard
✅ Download markdown as file
✅ View markdown for previously uploaded files
✅ Detailed file statistics (lines, file size)
✅ Beautiful modal UI with proper theming
✅ Works with PDF, DOCX, and TXT files
✅ Dark mode support

## Database Migration

The database will automatically add the `raw_markdown` column when the backend starts (via `Base.metadata.create_all()`).

If using migrations, the migration file `backend/alembic/versions/add_raw_markdown.py` is available.

## API Response Example

```json
{
  "file": {
    "id": 1,
    "filename": "document.pdf",
    "filepath": "/path/to/document.pdf",
    "filetype": "pdf",
    "size_mb": 2.5,
    "uploaded_at": "2024-12-14T10:00:00",
    "updated_at": "2024-12-14T10:00:00",
    "converted_with_docling": true,
    "raw_markdown": "# Document Title\n\n## Section 1\n\nContent here..."
  },
  "chunks": 15,
  "raw_markdown": "# Document Title\n\n## Section 1\n\nContent here..."
}
```
