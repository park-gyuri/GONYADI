from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import os
import shutil
import uuid
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.review_schema import ReviewCreate, ReviewListItem, ReviewDetailResponse, TopLikedReview, ReviewUpdate, PlaceReviewItem, PlaceStats, PlacesStatsRequest
from src.crud import review_crud
from src.core.security import get_current_user

router = APIRouter()

@router.post("/reviews/upload-images")
def upload_review_images(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    from src.core.supabase_client import upload_file_to_supabase
    """
    여러 장의 리뷰 이미지를 Supabase Storage에 업로드하고 Public URL 리스트를 반환합니다.
    """
    saved_urls = []
    
    for file in files:
        extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        unique_filename = f"review_{uuid.uuid4().hex}{extension}"
        
        try:
            file_bytes = file.file.read()
            public_url = upload_file_to_supabase(file_bytes=file_bytes, file_name=unique_filename, bucket_name="images")
            saved_urls.append(public_url)
        except Exception as e:
            print(f"[ERROR] Supabase 리뷰 이미지 업로드 실패 ({unique_filename}): {e}")
            raise HTTPException(status_code=500, detail=f"이미지 업로드 중 오류 발생: {str(e)}")
            
    return {"uploaded_urls": saved_urls}

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

@router.get("/reviews/place/{place_id}", response_model=list[PlaceReviewItem])
def get_place_reviews(place_id: str, session: Session = Depends(get_session)):
    return review_crud.get_place_reviews(session=session, place_id=place_id)

@router.post("/reviews/places-stats", response_model=dict[str, PlaceStats])
def get_places_stats(req: PlacesStatsRequest, session: Session = Depends(get_session)):
    return review_crud.get_places_stats(session=session, place_ids=req.place_ids)

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
