from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Places(SQLModel, table=True):
    place_pk: Optional[int] = Field(default=None, primary_key=True)

    # 기본 정보 (Gemini가 채워줌)
    name:     str   = Field(index=True)
    lat:      float
    lng:      float
    category: str
    # 5.1에서 Google Places API로 채울 필드들 (지금은 null 허용)
    google_place_id: Optional[str] = Field(default=None, unique=True, index=True)
    address:         Optional[str] = Field(default=None)
    rating:          Optional[float] = Field(default=None)
    opening_hours:   Optional[str]   = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.now)