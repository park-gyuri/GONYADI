from dotenv import load_dotenv
import os
from sqlmodel import create_engine, Session



# 1. .env 파일의 설정값 불러오기
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# 2. DB 접속 주소 (URL) 생성
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:5432/{DB_NAME}"

# 3. DB 엔진(DB와 파이썬을 연결하고 관리하는 통로) 생성
engine = create_engine(DATABASE_URL, echo=True)

# API에서 쓸 DB 세션 생성
def get_session():
    with Session(engine) as session:
        yield session