import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from src.api import auth_api
from src.api import recommend_api
from src.api import save_api

load_dotenv()

app = FastAPI()

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
