import asyncio
from fastapi import APIRouter, Depends
from sqlmodel import Session
from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import Users
from src.schemas.recommend_schema import RecommendRequest, RecommendResponse, RouteSegment, RouteDetail
from src.services.prompt_builder import build_hybrid_prompt
from src.services.gemini import get_gemini_places
from src.services.google_routes import build_route_segments
import src.crud.place_crud as place_crud



router = APIRouter(prefix="/recommend", tags=["recommend"])

@router.post("", response_model=RecommendResponse)
async def handle_recommendation(
    req: RecommendRequest, 
    session: Session = Depends(get_session)
): 
    prompt = build_hybrid_prompt(req)
    
    # 1. Gemini로 장소 추천받기
    places_from_ai = get_gemini_places(prompt)

    # 2. DB에 장소 저장/갱신 (Google Places API를 통해 좌표가 정확히 보정됨)
    db_places = place_crud.get_or_create_places_bulk(places_from_ai, session)

    # 3. Gemini가 추천한 결과(places_from_ai)에 보정된 좌표(lat, lng) 덮어쓰기
    for ai_place, db_place in zip(places_from_ai, db_places):
        ai_place.lat = db_place.lat
        ai_place.lng = db_place.lng

    # 3. Google Routes API로 장소 간 경로 계산
    #    유저가 선택한 이동 수단(transports)만 조회
    transport_names = [t.value for t in req.transports]  # e.g. ["도보", "자동차"]
    raw_segments = build_route_segments(places_from_ai, transport_names)

    # 4. dict -> RouteSegment 스키마로 변환
    route_segments: list[RouteSegment] = []
    for seg in raw_segments:
        routes_typed = {}
        for mode_key, route_data in seg["routes"].items():
            if route_data:
                routes_typed[mode_key] = RouteDetail(**route_data)
            else:
                routes_typed[mode_key] = None
        route_segments.append(
            RouteSegment(
                from_name=seg["from_name"],
                to_name=seg["to_name"],
                routes=routes_typed,
            )
        )

    return RecommendResponse(
        status="completed",
        prompt_preview=prompt,
        places=places_from_ai,
        route_segments=route_segments,
    )