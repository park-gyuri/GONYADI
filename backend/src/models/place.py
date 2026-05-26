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

    # 특수 조건 검증 결과 (None=미확인, True=가능, False=불가)
    is_pet_friendly: Optional[bool] = Field(default=None)
    is_accessible:   Optional[bool] = Field(default=None)

    # 축제 기간 (contentTypeId=15 장소 전용, YYYYMMDD 형식)
    festival_start_date: Optional[str] = Field(default=None)
    festival_end_date:   Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.now)