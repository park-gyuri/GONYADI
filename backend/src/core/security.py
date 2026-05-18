import bcrypt
from dotenv import load_dotenv
import os
from typing import Optional
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from src.models.user import Users
from src.core.database import get_session


# 1. 암호화 알고리즘: bcrypt 직접 사용

# 2. 평문 비밀번호를 해시로 바꾸는 함수 (회원가입 시 사용)
def change_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# 3. 입력한 비번이 저장된 해시와 일치하는지 확인하는 함수 (로그인 시 사용)
def verify_password(input_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(input_password.encode("utf-8"), hashed_password.encode("utf-8"))




load_dotenv()

# ---------- JWT 토큰 ----------
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# 유효 기간 설정
ACCESS_TOKEN_EXPIRE_MINUTES = 30       # Access Token: 30분 (짧게)
REFRESH_TOKEN_EXPIRE_DAYS = 14         # Refresh Token: 14일 (길게)

# 토큰 발행 공통 함수
def create_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 1. Access Token 생성 (단기)
def create_access_token(data: dict):
    return create_token(data, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

# 2. Refresh Token 생성 (장기)
def create_refresh_token(data: dict):
    return create_token(data, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

# 토큰 검증 함수
def verify_access_token(token: str):
    try: 
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ---------- 로그인 사용자 인증 ----------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    token:   str     = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> Users:

    credentials_exception = HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail      = "인증에 실패했습니다.",
    )

    # 1. 토큰 검증
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception

    # 2. 토큰에서 user PK 꺼내기
    user_pk: str = payload.get("sub")
    if user_pk is None:
        raise credentials_exception

    # 3. DB에서 유저 찾기
    user = session.exec(select(Users).where(Users.user_pk == int(user_pk))).first()
    if user is None:
        raise credentials_exception

    return user