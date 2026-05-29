from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import os
import shutil
import uuid
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.review_schema import ReviewCreate, ReviewListItem, ReviewDetailResponse, TopLikedReview, ReviewUpdate
from src.crud import review_crud
from src.core.security import get_current_user

router = APIRouter()

@router.post("/reviews/upload-images")
def upload_review_images(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    여러 장의 리뷰 이미지를 서버에 업로드하고 서버 내 상대 경로 리스트를 반환합니다.
    """
    upload_dir = os.path.join("static", "review_images")
    os.makedirs(upload_dir, exist_ok=True)
    
    saved_paths = []
    for file in files:
        extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        unique_filename = f"review_{uuid.uuid4().hex}{extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        relative_url = f"/static/review_images/{unique_filename}"
        saved_paths.append(relative_url)
        
    return {"uploaded_urls": saved_paths}

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

@router.put("/reviews/{review_id}", response_model=ReviewDetailResponse)
def update_review(
    review_id: int,
    review_in: ReviewUpdate,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    review = review_crud.update_review(
        session=session,
        review_id=review_id,
        review_in=review_in,
        user_id=current_user.user_pk
    )
    if not review:
        raise HTTPException(status_code=404, detail="Review not found or not authorized")
    return review_crud.get_review_by_id(session=session, review_id=review.review_pk)

@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    session: Session = Depends(get_session),
    current_user: dict = Depends(get_current_user)
):
    success = review_crud.delete_review(
        session=session,
        review_id=review_id,
        user_id=current_user.user_pk
    )
    if not success:
        raise HTTPException(status_code=404, detail="Review not found or not authorized")
    return {"message": "Review deleted successfully"}
