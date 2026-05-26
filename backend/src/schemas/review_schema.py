from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReviewCreate(BaseModel):
    itinerary_id: int
    title: str
    ratings: Dict[str, int]
    comments: Dict[str, str]
    photos: Dict[str, List[str]]

class ReviewListItem(BaseModel):
    review_pk: int
    itinerary_id: int
    user_id: int
    title: str
    preview_comment: Optional[str] = None
    thumbnail: Optional[str] = None
    region: Optional[str] = None
    author: Optional[str] = None
    created_at: datetime
    like_count: int = 0

class TopLikedReview(BaseModel):
    review_pk: int
    title: str
    region: Optional[str] = None
    thumbnail: Optional[str] = None
    like_count: int = 0

class ReviewDetailResponse(BaseModel):
    review_pk: int
    itinerary_id: int
    user_id: int
    title: str
    ratings: Dict[str, int]
    comments: Dict[str, str]
    photos: Dict[str, List[str]]
    created_at: datetime
    recommendation_data: Optional[Dict[str, Any]] = None
    region: Optional[str] = None
    days: Optional[int] = None
