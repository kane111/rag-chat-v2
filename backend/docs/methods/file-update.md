# PUT /file/{id}

- **Description**: Replace an existing file by deleting prior records/embeddings and re-ingesting the new upload.
- **Dependencies**: `services.ingest.reingest_file`, `services.ingest.remove_file`.
- **Side effects**: Removes old embeddings and files, writes new file, chunks, and embeddings; updates SQLite records.
- **Inputs**: Path param `id`, UploadFile body.
- **Outputs**: `IngestResponse` for the new version.
