import os
from fastapi import FastAPI
from dotenv import load_dotenv
from src.api import auth_api
from src.api import recommend_api
  

load_dotenv()

app = FastAPI()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 라우터 연결로 엔드포인트 등록
app.include_router(auth_api.router, prefix="/api/v1")
app.include_router(recommend_api.router, prefix="/api/v1")
