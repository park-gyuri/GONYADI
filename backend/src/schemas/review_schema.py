from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReviewCreate(BaseModel):
    itinerary_id: int
    title: str
    ratings: Dict[str, int]
    comments: Dict[str, str]
    photos: Dict[str, List[str]]
    thumbnail_place_id: Optional[str] = None

class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    ratings: Optional[Dict[str, int]] = None
    comments: Optional[Dict[str, str]] = None
    photos: Optional[Dict[str, List[str]]] = None
    thumbnail_place_id: Optional[str] = None

class ReviewListItem(BaseModel):
    review_pk: int
    itinerary_id: int
    user_id: int
    title: str
    preview_comment: Optional[str] = None
    thumbnail: Optional[str] = None
    region: Optional[str] = None
    author: Optional[str] = None
    author_profile_image: Optional[str] = None
    created_at: datetime
    like_count: int = 0
    places: List[str] = []

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
    thumbnail_place_id: Optional[str] = None
    created_at: datetime
    recommendation_data: Optional[Dict[str, Any]] = None
    region: Optional[str] = None
    days: Optional[int] = None

class PlaceReviewItem(BaseModel):
    review_pk: int
    author: str
    author_profile_image: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    photos: List[str] = []
    created_at: datetime

class PlaceStats(BaseModel):
    average_rating: float
    review_count: int
    summary: Optional[str] = None

class PlacesStatsRequest(BaseModel):
    place_ids: List[str]
