from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.review_schema import ReviewCreate, ReviewListItem, ReviewDetailResponse, TopLikedReview
from src.crud import review_crud
from src.core.security import get_current_user

router = APIRouter()

@router.post("/reviews", response_model=ReviewDetailResponse)
def create_review(
    review_in: ReviewCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    review = review_crud.create_review(session=session, review_in=review_in, user_id=current_user.user_pk)
    return review_crud.get_review_by_id(session=session, review_id=review.review_pk)

@router.get("/reviews", response_model=list[ReviewListItem])
def get_reviews(session: Session = Depends(get_session)):
    return review_crud.get_all_reviews(session=session)

@router.get("/reviews/top-liked", response_model=list[TopLikedReview])
def get_top_liked(session: Session = Depends(get_session)):
    return review_crud.get_top_liked_reviews(session=session)

@router.get("/reviews/my-likes")
def get_my_likes(
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    liked_ids = review_crud.get_user_liked_review_ids(session=session, user_id=current_user.user_pk)
    return {"liked_review_ids": liked_ids}

@router.get("/reviews/{review_id}", response_model=ReviewDetailResponse)
def get_review(review_id: int, session: Session = Depends(get_session)):
    review = review_crud.get_review_by_id(session=session, review_id=review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@router.post("/reviews/{review_id}/like", status_code=200)
def like_review(
    review_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    review = review_crud.like_review(session=session, review_id=review_id, user_id=current_user.user_pk)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"like_count": review.like_count}

@router.delete("/reviews/{review_id}/like", status_code=200)
def unlike_review(
    review_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    review = review_crud.unlike_review(session=session, review_id=review_id, user_id=current_user.user_pk)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"like_count": review.like_count}
