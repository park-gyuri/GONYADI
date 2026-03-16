from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    usr: Optional[int] = Field(default=None, primary_key=True)
    usr_id: str = Field(unique=True, index=True)
    usr_password: str
    usr_nickname: str
    usr_email: str = Field(unique=True)
    usr_point: int = Field(default=0)
    usr_created: datetime = Field(default_factory=datetime.now)

# 실제 DB에 테이블 생성은 alembic으로 대체