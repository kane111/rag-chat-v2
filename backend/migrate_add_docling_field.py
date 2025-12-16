"""
Migration script to add converted_with_docling field to files table.
Run this once to update your existing database.
"""
from pathlib import Path
from sqlalchemy import create_engine, text
from config import settings

DB_PATH = Path(settings.storage_dir) / "rag.db"

def migrate():
    engine = create_engine(f"sqlite:///{DB_PATH}")
    
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("PRAGMA table_info(files)"))
        columns = [row[1] for row in result]
        
        if 'converted_with_docling' not in columns:
            print("Adding converted_with_docling column to files table...")
            conn.execute(text(
                "ALTER TABLE files ADD COLUMN converted_with_docling BOOLEAN DEFAULT 0"
            ))
            conn.commit()
            print("✓ Migration complete!")
        else:
            print("✓ Column already exists, no migration needed.")

if __name__ == "__main__":
    migrate()
