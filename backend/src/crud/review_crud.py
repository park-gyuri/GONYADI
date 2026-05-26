from sqlmodel import Session, select
from src.models.review import Reviews
from src.models.itinerary import Itineraries
from src.schemas.review_schema import ReviewCreate, ReviewListItem, ReviewDetailResponse, TopLikedReview

def create_review(session: Session, review_in: ReviewCreate, user_id: int) -> Reviews:
    db_review = Reviews(
        itinerary_id=review_in.itinerary_id,
        user_id=user_id,
        title=review_in.title,
        ratings=review_in.ratings,
        comments=review_in.comments,
        photos=review_in.photos,
    )
    session.add(db_review)
    session.commit()
    session.refresh(db_review)
    return db_review

from src.models.user import Users

def get_all_reviews(session: Session) -> list[ReviewListItem]:
    statement = select(Reviews, Itineraries, Users).join(
        Itineraries, Reviews.itinerary_id == Itineraries.itinerary_pk, isouter=True
    ).join(
        Users, Reviews.user_id == Users.user_pk, isouter=True
    ).order_by(Reviews.created_at.desc())

    results = session.exec(statement).all()
    items = []
    for review, itinerary, user in results:
        all_comments = list(review.comments.values()) if review.comments else []
        preview = next((c for c in all_comments if c), None)

        all_photos = review.photos or {}
        thumbnail = None
        for photo_list in all_photos.values():
            if photo_list:
                thumbnail = photo_list[0]
                break

        items.append(ReviewListItem(
            review_pk=review.review_pk,
            itinerary_id=review.itinerary_id,
            user_id=review.user_id,
            title=review.title,
            preview_comment=preview,
            thumbnail=thumbnail,
            region=itinerary.region if itinerary else None,
            author=user.user_nickname if user else "익명 사용자",
            created_at=review.created_at,
            like_count=review.like_count or 0,
        ))
    return items

def like_review(session: Session, review_id: int) -> Reviews | None:
    review = session.get(Reviews, review_id)
    if not review:
        return None
    review.like_count = (review.like_count or 0) + 1
    session.add(review)
    session.commit()
    session.refresh(review)
    return review


def unlike_review(session: Session, review_id: int) -> Reviews | None:
    review = session.get(Reviews, review_id)
    if not review:
        return None
    review.like_count = max(0, (review.like_count or 0) - 1)
    session.add(review)
    session.commit()
    session.refresh(review)
    return review


def get_top_liked_reviews(session: Session, limit: int = 10) -> list[TopLikedReview]:
    statement = (
        select(Reviews, Itineraries)
        .join(Itineraries, Reviews.itinerary_id == Itineraries.itinerary_pk, isouter=True)
        .where(Reviews.like_count > 0)
        .order_by(Reviews.like_count.desc())
        .limit(limit)
    )
    results = session.exec(statement).all()
    items = []
    for review, itinerary in results:
        all_photos = review.photos or {}
        thumbnail = None
        for photo_list in all_photos.values():
            if photo_list:
                thumbnail = photo_list[0]
                break
        items.append(TopLikedReview(
            review_pk=review.review_pk,
            title=review.title,
            region=itinerary.region if itinerary else None,
            thumbnail=thumbnail,
            like_count=review.like_count or 0,
        ))
    return items


def get_review_by_id(session: Session, review_id: int) -> ReviewDetailResponse | None:
    statement = select(Reviews, Itineraries).join(
        Itineraries, Reviews.itinerary_id == Itineraries.itinerary_pk, isouter=True
    ).where(Reviews.review_pk == review_id)

    result = session.exec(statement).first()
    if not result:
        return None

    review, itinerary = result
    return ReviewDetailResponse(
        review_pk=review.review_pk,
        itinerary_id=review.itinerary_id,
        user_id=review.user_id,
        title=review.title,
        ratings=review.ratings or {},
        comments=review.comments or {},
        photos=review.photos or {},
        created_at=review.created_at,
        recommendation_data=itinerary.recommendation_data if itinerary else None,
        region=itinerary.region if itinerary else None,
        days=itinerary.days if itinerary else None,
    )
