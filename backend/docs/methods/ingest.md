# POST /ingest

- **Description**: Upload a file (PDF, DOCX, TXT) up to 50MB, convert to Markdown-like chunks, embed via Ollama `nomic-embed-text:latest`, and store chunks in ChromaDB + SQLite.
- **Dependencies**: `services.files.save_upload_file`, `services.conversion.convert_to_chunks`, `services.embedding.embed_text`, `services.chroma_client.upsert_chunks`, `services.ingest.ingest_file`.
- **Side effects**: Saves raw file to `storage/files`, persists metadata/chunks in SQLite, writes embeddings to `storage/chroma`.
- **Inputs**: `file` (UploadFile) with content types pdf/docx/txt.
- **Outputs**: `IngestResponse` with file metadata and chunk count.
