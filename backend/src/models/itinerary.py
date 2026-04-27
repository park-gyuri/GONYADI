from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, JSON

class Itineraries(SQLModel, table=True):
    itinerary_pk: Optional[int] = Field(default=None, primary_key=True)
    folder_id: Optional[int] = Field(default=None, foreign_key="folders.folder_pk", index=True)
    user_id: int = Field(default=1, index=True) # 현재 인증이 없으므로 기본값 1
    
    title: str
    region: str
    start_date: Optional[str] = Field(default=None)
    end_date: Optional[str] = Field(default=None)
    nights: Optional[int] = Field(default=None)
    days: Optional[int] = Field(default=None)
    number_of_people: Optional[int] = Field(default=None)
    budget_per_person: Optional[int] = Field(default=None)
    
    # 추천된 장소 및 경로 데이터를 JSON 형태로 통째로 저장하여 빠른 로딩 지원
    recommendation_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.now)
