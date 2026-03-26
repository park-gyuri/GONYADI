from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.user_schema import UserCreate, UserLogin
from src.core.security import verify_password, create_access_token
import src.crud.user_crud as user_crud

router = APIRouter(prefix="/auth", tags=["auth"])

#회원가입
@router.post("/register")
def register(
    user_input: UserCreate,
    session:    Session = Depends(get_session),
):
    if user_crud.get_user_by_email(user_input.user_email, session):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")

    return user_crud.create_user(user_input, session)


# 로그인
@router.post("/login")
def login(
    user_input: UserLogin,
    session:    Session = Depends(get_session),
):
    # 1. 아이디로 유저 찾기
    user = user_crud.get_user_by_id(user_input.user_id, session)
    if user is None:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")

    # 2. 비밀번호 확인
    if not verify_password(user_input.user_password, user.user_password):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")

    # 3. JWT 토큰 발급
    access_token = create_access_token(data={"sub": str(user.user_pk)})
    # user.user_pk → Users 모델의 PK (primary key)

    return {"access_token": access_token, "token_type": "bearer"}