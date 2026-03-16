import os
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

@app.post("/register")
def register(user_input: UserCreate, session: Session = Depends(get_session)):
    if user_crud.get_user_by_email(session, user_input.user_email):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")
    
    # 중복이 없으면 아래로 내려와서 가입 진행
    return user_crud.create_user(session, user_input)
