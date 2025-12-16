from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="RAG_", env_file=".env", extra="ignore")

    storage_dir: Path = Path(__file__).resolve().parent / "storage"
    file_dir: Path = storage_dir / "files"
    chroma_dir: Path = storage_dir / "chroma"

    # Frontend origins allowed to call the API; comma-separated via env if needed
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    chroma_collection: str = "kb_chunks"
    embedding_model: str = "embeddinggemma:latest"
    chat_model: str = "gemma3:4b"
    top_k: int = 12

    max_file_mb: int = 1
    # Tighter chunks improve grounding and reduce off-topic context
    chunk_size: int = 1024
    chunk_overlap: int = 400

    # Markdown header configuration for splitting content
    # Format: list of tuples (markdown_header_prefix, logical name)
    markdown_headers: list[tuple[str, str]] = [
        ("#", "Header 1"),
        ("##", "Header 2"),
    ]

    ollama_base_url: str = "http://localhost:11434"


def get_settings() -> Settings:
    settings = Settings()
    settings.file_dir.mkdir(parents=True, exist_ok=True)
    settings.chroma_dir.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
