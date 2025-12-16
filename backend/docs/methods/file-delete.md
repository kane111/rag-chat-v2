# DELETE /file/{id}

- **Description**: Remove a file, its chunks, and associated embeddings from storage, ChromaDB, and SQLite.
- **Dependencies**: `services.ingest.remove_file`, `services.chroma_client.delete_by_file`.
- **Side effects**: Deletes raw file on disk, removes Chroma vectors, cascades chunk/citation rows in SQLite.
- **Outputs**: Confirmation object `{ "status": "deleted" }`.
