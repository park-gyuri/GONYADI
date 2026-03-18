from sqlmodel import Session, select
from src.core.security import change_password_hash
from src.schemas.user_schema import UserCreate
from src.models.user import User



def create_user(session: Session, user_input: UserCreate):
    # 1. 입력받은 데이터를 딕셔너리로 변환 후 암호화
    user_dict = user_input.model_dump()
    user_dict["user_password"] = change_password_hash(user_input.user_password)

    # 2. 딕셔너리 -> 클래스 형태로 변환 후 DB에 저장
    user_db = User(**user_dict)

    session.add(user_db)
    session.commit()
    session.refresh(user_db)  # 새로고침 = 파이썬 객체 동기화

    return user_db

def get_user_by_email(user_email: str, session: Session):
    statement = select(User).where(User.user_email == user_email)
    return session.exec(statement).first()