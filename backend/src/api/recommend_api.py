import asyncio
import math
from fastapi import APIRouter, Depends
from sqlmodel import Session
from src.core.database import get_session
from src.core.security import get_current_user
from src.models.user import Users
from src.schemas.recommend_schema import RecommendRequest, RecommendResponse, RouteSegment, RouteDetail, DaySchedule, PlaceResult
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


def _flat_to_schedule(places: list[PlaceResult], total_days: int) -> list[DaySchedule]:
    """flat places 리스트를 total_days일 기준으로 균등 분배해 DaySchedule 리스트로 변환"""
    if not places:
        return []
    per_day = math.ceil(len(places) / total_days)
    schedule = []
    for day in range(1, total_days + 1):
        start = (day - 1) * per_day
        end = min(start + per_day, len(places))
        if start < len(places):
            schedule.append(DaySchedule(day=day, places=places[start:end]))
    return schedule


def _schedule_to_route_segments(schedule: list[DaySchedule], transport_names: list[str]) -> list[RouteSegment]:
    """각 일차 내 장소 간 경로만 계산 (일차 경계는 계산 안 함)"""
    all_segments: list[RouteSegment] = []
    for day_sched in schedule:
        if len(day_sched.places) > 1:
            all_segments.extend(_build_route_segments(day_sched.places, transport_names))
    return all_segments


@router.post("", response_model=RecommendResponse)
async def handle_recommendation(
    req: RecommendRequest,
    session: Session = Depends(get_session),
):
    transport_names = [t.value for t in req.transports]

    # ──────────────────────────────────────────────────────────────────────────
    # [RAG 파이프라인] center_lat/lng가 있을 때 — DB-First → Spatial → LLM Curation
    # ──────────────────────────────────────────────────────────────────────────
    total_days = req.days or 1

    if req.center_lat is not None and req.center_lng is not None:
        print(f"[추천] RAG 파이프라인 실행 (center={req.center_lat},{req.center_lng})")

        candidates = await retrieve_and_filter_candidates(req, session)

        if candidates:
            rag_prompt = build_rag_prompt(req, candidates)
            places_from_ai = get_gemini_curated_places(rag_prompt, candidates)

            if places_from_ai:
                # flat places → 일차별 분배
                schedule = _flat_to_schedule(places_from_ai, total_days)
                route_segments = _schedule_to_route_segments(schedule, transport_names)
                return RecommendResponse(
                    status="completed",
                    prompt_preview=rag_prompt,
                    schedule=schedule,
                    places=places_from_ai,
                    route_segments=route_segments,
                )
            else:
                print("[RAG] LLM 큐레이션 결과 없음 → 기존 Gemini 단독 방식으로 fallback")

    # ──────────────────────────────────────────────────────────────────────────
    # [Gemini 단독 방식] center_lat/lng 없거나 RAG 실패 시
    # ──────────────────────────────────────────────────────────────────────────
    print("[추천] Gemini 단독 방식 실행")
    prompt = build_hybrid_prompt(req)

    # 1. Gemini로 일차별 장소 추천받기
    day_schedules: list[DaySchedule] = get_gemini_places(prompt)

    # 2. DB에 장소 저장/갱신 (좌표 보정)
    all_places = [p for d in day_schedules for p in d.places]
    db_places = place_crud.get_or_create_places_bulk(all_places, session)
    for ai_place, db_place in zip(all_places, db_places):
        ai_place.lat = db_place.lat
        ai_place.lng = db_place.lng

    # 3. 일차 내 장소 간 경로 계산
    route_segments = _schedule_to_route_segments(day_schedules, transport_names)

    return RecommendResponse(
        status="completed",
        prompt_preview=prompt,
        schedule=day_schedules,
        places=all_places,
        route_segments=route_segments,
    )