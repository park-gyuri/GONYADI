"""merge migration heads

Revision ID: 58cd4536b0eb
Revises: 060e3cfcecd8, a3f7d9e21b40
Create Date: 2026-05-16 00:50:58.226170

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '58cd4536b0eb'
down_revision: Union[str, Sequence[str], None] = ('060e3cfcecd8', 'a3f7d9e21b40')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
