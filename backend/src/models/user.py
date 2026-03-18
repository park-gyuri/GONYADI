from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    user: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(unique=True, index=True)
    user_password: str
    user_nickname: str
    user_email: str = Field(unique=True)
    user_point: int = Field(default=0)
    user_created: datetime = Field(default_factory=datetime.now)

# 실제 DB에 테이블 생성은 alembic으로 대체