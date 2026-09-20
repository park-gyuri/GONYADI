import sys
from sqlmodel import Session, select, text
from src.core.database import engine
from src.models.review import Reviews, UserReviewLike

def delete_review_17():
    with Session(engine) as session:
        r = session.get(Reviews, 17)
        if r:
            print(f"Deleting review: {r.title}")
            likes = session.exec(select(UserReviewLike).where(UserReviewLike.review_id == r.review_pk)).all()
            for like in likes:
                session.delete(like)
            
            session.flush() # <--- DB 반영
            
            session.delete(r)
            session.commit()
            print("Deleted successfully.")
        else:
            print("Review 17 not found.")

if __name__ == "__main__":
    delete_review_17()
