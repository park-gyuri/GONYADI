import ast
from fastapi import APIRouter, Depends
from sqlmodel import Session
from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import Users
from src.schemas.recommend_schema import RecommendRequest, RecommendResponse
from src.services.prompt_builder import build_hybrid_prompt
from src.services.gemini import get_gemini_places



router = APIRouter(prefix="/recommend", tags=["recommend"])

@router.post("", response_model=RecommendResponse)
async def handle_recommendation(
	req: RecommendRequest, 
	#current_user: Users = Depends(get_current_user), 프론트엔드 로그인 화면 구현 전까지 주석 처리
	session: Session = Depends(get_session)
): 
    prompt = build_hybrid_prompt(req)
    places = get_gemini_places(prompt)
    return RecommendResponse (
	    status = "completed", 
	    prompt_preview = prompt,
        places = places
	    )
    