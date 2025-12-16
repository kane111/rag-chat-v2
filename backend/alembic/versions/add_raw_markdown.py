"""Add raw_markdown field to files table

Revision ID: add_raw_markdown
Revises: 
Create Date: 2024-12-14

"""
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Add raw_markdown column to files table if it doesn't exist
    op.add_column('files', sa.Column('raw_markdown', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove raw_markdown column from files table
    op.drop_column('files', 'raw_markdown')
