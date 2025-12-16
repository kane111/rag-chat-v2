# GET /stats

- **Description**: Returns aggregate counts of files, chunks, conversations, and messages from SQLite.
- **Dependencies**: SQLAlchemy session via `get_db`, models `File`, `Chunk`, `Conversation`, `Message`.
- **Side effects**: None.
- **Outputs**: `StatsResponse` JSON.
