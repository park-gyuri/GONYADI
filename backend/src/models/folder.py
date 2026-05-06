from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Folders(SQLModel, table=True):
    folder_pk: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(default=1, index=True) # 현재 인증이 없으므로 기본값 1
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
