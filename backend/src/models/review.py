from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, JSON

class Reviews(SQLModel, table=True):
    review_pk: Optional[int] = Field(default=None, primary_key=True)
    itinerary_id: int = Field(index=True, foreign_key="itineraries.itinerary_pk")
    user_id: int = Field(default=1, index=True)
    title: str
    ratings: dict = Field(default_factory=dict, sa_column=Column(JSON))
    comments: dict = Field(default_factory=dict, sa_column=Column(JSON))
    photos: dict = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.now)
    like_count: int = Field(default=0)
