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
    session: Session = Depends(get_session)
): 
    prompt = build_hybrid_prompt(req)
    
    # 수정 전: places_from_ai = await asyncio.to_thread(get_gemini_places, prompt, req.region)
    # 수정 후: 직접 await로 호출 (req.region도 삭제)
    #places_from_ai = await get_gemini_places(prompt) 
    places_from_ai = get_gemini_places(prompt)
    # 이제 places_from_ai는 'coroutine'이 아니라 실제 'list' 데이터가 됩니다.
    db_places = place_crud.get_or_create_places_bulk(places_from_ai, session)

    return RecommendResponse (
        status = "completed", 
        prompt_preview = prompt,
        places = places_from_ai
    )