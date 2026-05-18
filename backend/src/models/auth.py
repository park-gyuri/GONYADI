from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, timedelta

class EmailVerification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    code: str
    expire_at: datetime = Field(default_factory=lambda: datetime.now() + timedelta(minutes=5))
    is_used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)
