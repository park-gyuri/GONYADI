import asyncio
from fastapi import APIRouter, Depends
from sqlmodel import Session
from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import Users
from src.schemas.recommend_schema import RecommendRequest, RecommendResponse, RouteSegment, RouteDetail
from src.services.prompt_builder import build_hybrid_prompt, build_rag_prompt
from src.services.gemini import get_gemini_places, get_gemini_curated_places
from src.services.google_routes import build_route_segments
from src.services.rag_retrieval import retrieve_and_filter_candidates
import src.crud.place_crud as place_crud


router = APIRouter(prefix="/recommend", tags=["recommend"])


def _build_route_segments(places_from_ai, transport_names) -> list[RouteSegment]:
    """장소 리스트 → RouteSegment 리스트 변환 헬퍼"""
    raw_segments = build_route_segments(places_from_ai, transport_names)
    route_segments: list[RouteSegment] = []
    for seg in raw_segments:
        routes_typed = {}
        for mode_key, route_data in seg["routes"].items():
            routes_typed[mode_key] = RouteDetail(**route_data) if route_data else None
        route_segments.append(
            RouteSegment(
                from_name=seg["from_name"],
                to_name=seg["to_name"],
                routes=routes_typed,
            )
        )
    return route_segments


@router.post("", response_model=RecommendResponse)
async def handle_recommendation(
    req: RecommendRequest,
    session: Session = Depends(get_session),
):
    transport_names = [t.value for t in req.transports]

    # ──────────────────────────────────────────────────────────────────────────
    # [RAG 파이프라인] center_lat/lng가 있을 때 — DB-First → Spatial → LLM Curation
    # ──────────────────────────────────────────────────────────────────────────
    if req.center_lat is not None and req.center_lng is not None:
        print(f"[추천] RAG 파이프라인 실행 (center={req.center_lat},{req.center_lng})")

        # Step 1+2+4: DB 조회 → Spatial Filter → Fallback(필요 시)
        candidates = await retrieve_and_filter_candidates(req, session)

        if candidates:
            # Step 3: LLM Curation — 후보 풀 안에서만 선택
            rag_prompt = build_rag_prompt(req, candidates)
            places_from_ai = get_gemini_curated_places(rag_prompt, candidates)

            if places_from_ai:
                # 경로 계산
                route_segments = _build_route_segments(places_from_ai, transport_names)
                return RecommendResponse(
                    status="completed",
                    prompt_preview=rag_prompt,
                    places=places_from_ai,
                    route_segments=route_segments,
                )
            else:
                # LLM 큐레이션 실패 → 기존 방식으로 fallback
                print("[RAG] LLM 큐레이션 결과 없음 → 기존 Gemini 단독 방식으로 fallback")

    # ──────────────────────────────────────────────────────────────────────────
    # [기존 Gemini 단독 방식] center_lat/lng 없거나 RAG 실패 시
    # (재추천 기능 및 초기 호환성 유지)
    # ──────────────────────────────────────────────────────────────────────────
    print("[추천] 기존 Gemini 단독 방식 실행")
    prompt = build_hybrid_prompt(req)

    # 1. Gemini로 장소 추천받기
    places_from_ai = get_gemini_places(prompt)

    # 2. DB에 장소 저장/갱신 (Google Places API를 통해 좌표가 정확히 보정됨)
    db_places = place_crud.get_or_create_places_bulk(places_from_ai, session)

    # 3. Gemini가 추천한 결과(places_from_ai)에 보정된 좌표(lat, lng) 덮어쓰기
    for ai_place, db_place in zip(places_from_ai, db_places):
        ai_place.lat = db_place.lat
        ai_place.lng = db_place.lng

    # 4. Google Routes API로 장소 간 경로 계산
    route_segments = _build_route_segments(places_from_ai, transport_names)

    return RecommendResponse(
        status="completed",
        prompt_preview=prompt,
        places=places_from_ai,
        route_segments=route_segments,
    )