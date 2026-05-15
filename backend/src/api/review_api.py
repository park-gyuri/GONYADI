from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.review_schema import ReviewCreate, ReviewListItem, ReviewDetailResponse
from src.crud import review_crud

router = APIRouter()

TEMP_USER_ID = 1

@router.post("/reviews", response_model=ReviewDetailResponse)
def create_review(review_in: ReviewCreate, session: Session = Depends(get_session)):
    review = review_crud.create_review(session=session, review_in=review_in, user_id=TEMP_USER_ID)
    return review_crud.get_review_by_id(session=session, review_id=review.review_pk)

@router.get("/reviews", response_model=list[ReviewListItem])
def get_reviews(session: Session = Depends(get_session)):
    return review_crud.get_all_reviews(session=session)

@router.get("/reviews/{review_id}", response_model=ReviewDetailResponse)
def get_review(review_id: int, session: Session = Depends(get_session)):
    review = review_crud.get_review_by_id(session=session, review_id=review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review
