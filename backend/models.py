from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class User(SQLModel, table=True):
    # PK
    usr: Optional[int] = Field(default=None, primary_key=True)
    
    # 사용자 입력 필수 정보
    usr_id: str = Field(unique=True, index=True)
    usr_password: str   
    usr_nickname: str
    
    # 고유 정보 (이메일)
    usr_email: str = Field(unique=True)
    
    # 시스템 자동 부여 정보
    usr_point: int = Field(default=0)
    usr_created: datetime = Field(default_factory=datetime.now)