import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from sqlmodel import SQLModel, text
from src.api import auth_api
from src.api import recommend_api
from src.api import save_api
from src.api import review_api
from src.api import admin_api

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    from src.core.database import engine
    from src.models import auth  # noqa: F401 — EmailVerification 모델 로드
    from src.models import review  # noqa: F401 — UserReviewLike 모델 로드
    SQLModel.metadata.create_all(engine)
    # places 테이블 신규 컬럼 마이그레이션 (이미 존재하면 무시)
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS user_profile_image VARCHAR"))
            conn.commit()
        except Exception:
            conn.rollback()
            
        for col, coltype in [("is_pet_friendly", "BOOLEAN"), ("is_accessible", "BOOLEAN")]:
            try:
                conn.execute(text(f"ALTER TABLE places ADD COLUMN IF NOT EXISTS {col} {coltype}"))
                conn.commit()
            except Exception:
                conn.rollback()
        try:
            conn.execute(text("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0"))
            conn.commit()
        except Exception:
            conn.rollback()
        for col in ["festival_start_date", "festival_end_date"]:
            try:
                conn.execute(text(f"ALTER TABLE places ADD COLUMN IF NOT EXISTS {col} VARCHAR"))
                conn.commit()
            except Exception:
                conn.rollback()
    yield

app = FastAPI(lifespan=lifespan)

# 정적 파일 제공 디렉토리 생성 및 마운트
os.makedirs("static/profile_images", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS 설정 — 프론트엔드(Expo 웹/모바일)에서 API 접근 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # 개발 중 모든 origin 허용 (배포 시 특정 도메인으로 제한)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 라우터 연결로 엔드포인트 등록
app.include_router(auth_api.router, prefix="/api/v1")
app.include_router(recommend_api.router, prefix="/api/v1")
app.include_router(save_api.router, prefix="/api/v1")
app.include_router(review_api.router, prefix="/api/v1")
app.include_router(admin_api.router)
