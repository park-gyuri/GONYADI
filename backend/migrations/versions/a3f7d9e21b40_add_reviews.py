"""Add reviews table

Revision ID: a3f7d9e21b40
Revises: 1eff6e40b8d9
Create Date: 2026-05-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'a3f7d9e21b40'
down_revision: Union[str, Sequence[str], None] = '1eff6e40b8d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'reviews',
        sa.Column('review_pk', sa.Integer(), nullable=False),
        sa.Column('itinerary_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('ratings', sa.JSON(), nullable=True),
        sa.Column('comments', sa.JSON(), nullable=True),
        sa.Column('photos', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['itinerary_id'], ['itineraries.itinerary_pk'], ),
        sa.PrimaryKeyConstraint('review_pk'),
    )
    op.create_index(op.f('ix_reviews_itinerary_id'), 'reviews', ['itinerary_id'], unique=False)
    op.create_index(op.f('ix_reviews_user_id'), 'reviews', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_reviews_user_id'), table_name='reviews')
    op.drop_index(op.f('ix_reviews_itinerary_id'), table_name='reviews')
    op.drop_table('reviews')
