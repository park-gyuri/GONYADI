import asyncio
from fastapi import APIRouter, Depends
from sqlmodel import Session
from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import Users
from src.schemas.recommend_schema import RecommendRequest, RecommendResponse
from src.services.prompt_builder import build_hybrid_prompt
from src.services.gemini import get_gemini_places
import src.crud.place_crud as place_crud



router = APIRouter(prefix="/recommend", tags=["recommend"])

@router.post("", response_model=RecommendResponse)
async def handle_recommendation(
	req: RecommendRequest, 
	#current_user: Users = Depends(get_current_user), 프론트엔드 로그인 화면 구현 전까지 주석 처리
	session: Session = Depends(get_session)
): 
    prompt = build_hybrid_prompt(req)
    places_from_ai = await asyncio.to_thread(get_gemini_places, prompt) # ai에게 장소 얻기
    db_places = place_crud.get_or_create_places_bulk(places_from_ai, session) # db 매칭
	

    return RecommendResponse (
	    status = "completed", 
	    prompt_preview = prompt,
        places = places_from_ai
	    )
    
