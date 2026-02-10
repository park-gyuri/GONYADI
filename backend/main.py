import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@app.get("/")
async def root():
	return {
        "status" : "success",
        "message" : "env 및 서버 연결 성공",
        "key_check" : f"가져온 키의 앞글자 : {GEMINI_API_KEY[:4]}..."
        }
