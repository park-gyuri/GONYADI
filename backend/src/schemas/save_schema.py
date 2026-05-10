from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# 폴더 스키마
class FolderCreate(BaseModel):
    name: str

class FolderResponse(BaseModel):
    folder_pk: int
    user_id: int
    name: str
    created_at: datetime

# 일정 스키마
class ItineraryCreate(BaseModel):
    folder_id: Optional[int] = None
    title: str
    region: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    nights: Optional[int] = None
    days: Optional[int] = None
    number_of_people: Optional[int] = None
    budget_per_person: Optional[int] = None
    recommendation_data: Dict[str, Any]  # RecommendResponse 데이터 전체

class ItineraryResponse(BaseModel):
    itinerary_pk: int
    folder_id: Optional[int]
    user_id: int
    title: str
    region: str
    start_date: Optional[str]
    end_date: Optional[str]
    nights: Optional[int]
    days: Optional[int]
    number_of_people: Optional[int]
    budget_per_person: Optional[int]
    recommendation_data: Dict[str, Any]
    created_at: datetime
