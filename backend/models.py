import os
from dotenv import load_dotenv
from sqlmodel import create_engine, SQLModel, Field
from typing import Optional
from datetime import datetime

# 1. .env 파일의 설정값 불러오기
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# 2. DB 접속 주소 (URL) 생성
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:5432/{DB_NAME}"

# 3. DB 엔진(DB와 파이썬을 연결하고 관리하는 통로) 생성
engine = create_engine(DATABASE_URL, echo=True)

# 4.DB에 테이블로 넣을 클래스 생성
class User(SQLModel, table=True):
    usr: Optional[int] = Field(default=None, primary_key=True)
    usr_id: str = Field(unique=True, index=True)
    usr_password: str
    usr_nickname: str
    usr_email: str = Field(unique=True)
    usr_point: int = Field(default=0)
    usr_created: datetime = Field(default_factory=datetime.now)

# 5. 실제 DB에 테이블을 만드는 함수
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    print("🚀 1단계: 프로그램 시작")
    print(f"🔗 접속 시도 주소: {DATABASE_URL}") # 주소가 의도대로 나오는지 확인
    
    try:
        create_db_and_tables()
        print("✅ 2단계: DB 테이블 생성 완료!")
    except Exception as e:
        print(f"❌ 에러 발생: {e}")