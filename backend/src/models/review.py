from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, JSON, UniqueConstraint

class Reviews(SQLModel, table=True):
    review_pk: Optional[int] = Field(default=None, primary_key=True)
    itinerary_id: int = Field(index=True, foreign_key="itineraries.itinerary_pk")
    user_id: int = Field(default=1, index=True)
    title: str
    ratings: dict = Field(default_factory=dict, sa_column=Column(JSON))
    comments: dict = Field(default_factory=dict, sa_column=Column(JSON))
    photos: dict = Field(default_factory=dict, sa_column=Column(JSON))
    thumbnail_place_id: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    like_count: int = Field(default=0)


class UserReviewLike(SQLModel, table=True):
    __tablename__ = "user_review_likes"
    __table_args__ = (UniqueConstraint("user_id", "review_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="users.user_pk")
    review_id: int = Field(index=True, foreign_key="reviews.review_pk")
    created_at: datetime = Field(default_factory=datetime.now)
