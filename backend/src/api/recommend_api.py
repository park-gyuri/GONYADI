import asyncio
import math
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.recommend_schema import (
    RecommendRequest, RecommendResponse,
    RouteSegment, RouteDetail, DaySchedule, PlaceResult,
)
from src.services.prompt_builder import build_rag_prompt
from src.services.gemini import get_gemini_curated_places, critique_and_revise_itinerary
from src.services.google_routes import build_route_segments
from src.services.rag_retrieval import retrieve_and_filter_candidates, MIN_CANDIDATES
import src.crud.place_crud as place_crud


router = APIRouter(prefix="/recommend", tags=["recommend"])


async def _geocode_region(region: str) -> tuple[float, float] | None:
    """지역명을 Google Places Text Search로 좌표로 변환. 실패 시 None 반환."""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        print("[Geocoding] GOOGLE_MAPS_API_KEY 없음")
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": api_key,
                    "X-Goog-FieldMask": "places.location,places.displayName",
                },
                json={
                    "textQuery": f"{region} 한국",
                    "maxResultCount": 1,
                    "languageCode": "ko",
                },
            )
            data = resp.json()
        places = data.get("places", [])
        if places:
            loc = places[0].get("location", {})
            lat = loc.get("latitude")
            lng = loc.get("longitude")
            if lat and lng:
                print(f"[Geocoding] '{region}' → ({lat}, {lng})")
                return lat, lng
        print(f"[Geocoding] '{region}' 검색 결과 없음")
    except Exception as e:
        print(f"[Geocoding] '{region}' 변환 실패: {e}")
    return None


def _build_route_segments(places_from_ai, transport_names) -> list[RouteSegment]:
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
    total_days = req.days or 1

    # ── 좌표 확보: 프론트에서 못 받았으면 백엔드에서 Geocoding 재시도 ─────────
    center_lat = req.center_lat
    center_lng = req.center_lng

    if center_lat is None or center_lng is None:
        print(f"[추천] center_lat/lng 없음 → 백엔드 Geocoding 시도: '{req.region}'")
        coords = await _geocode_region(req.region)
        if coords:
            center_lat, center_lng = coords
            req = req.model_copy(update={"center_lat": center_lat, "center_lng": center_lng})
        else:
            raise HTTPException(
                status_code=422,
                detail=f"'{req.region}' 지역의 좌표를 찾을 수 없습니다. 지역명을 다시 확인해 주세요.",
            )

    # ── RAG 파이프라인 ────────────────────────────────────────────────────────
    print(f"[추천] RAG 파이프라인 실행 (center={center_lat},{center_lng})")
    candidates, used_radius_km = await retrieve_and_filter_candidates(req, session)

    if not candidates:
        raise HTTPException(
            status_code=404,
            detail=f"'{req.region}' 주변에서 조건에 맞는 장소를 찾지 못했습니다. 검색 범위나 테마를 변경해 보세요.",
        )

    # 후보 부족 여부 판단 (자동 확장 없이 사용자에게 선택권 부여)
    insufficient = len(candidates) < MIN_CANDIDATES
    shortage_msg = ""
    if insufficient:
        theme_str = "·".join([th.value for th in req.themes])
        shortage_msg = f"'{theme_str}' 장소가 부족합니다. 검색 반경을 넓히시겠습니까?"
        print(f"[추천] 후보 부족 ({len(candidates)}개 < {MIN_CANDIDATES}개) — 프론트 팝업 트리거")

    # ── Gemini Curation (1차: 후보 풀에서 장소 선택, day 경계 포함) ───────────
    # 동기 Gemini 함수를 스레드풀에서 실행해 async 이벤트 루프 블록 방지
    rag_prompt = build_rag_prompt(req, candidates)
    condition_values = [c.value for c in req.conditions]
    loop = asyncio.get_event_loop()
    schedule = await loop.run_in_executor(
        None, get_gemini_curated_places, rag_prompt, candidates, condition_values
    )

    # ── AI 검토 (2차: 중복·비현실적 동선 감지 및 보정) ────────────────────────
    if schedule:
        schedule = await loop.run_in_executor(
            None, critique_and_revise_itinerary, schedule, candidates, total_days, condition_values
        )

    if not schedule:
        # Gemini 큐레이션 실패 → 검증된 DB 후보 상위 N개를 균등 분할로 fallback
        print("[RAG] Gemini 큐레이션 결과 없음 → DB 후보 직접 사용")
        fallback_places = [
            PlaceResult(
                name=c.name,
                lat=c.lat,
                lng=c.lng,
                reason="",
                duration=60,
                category=c.category,
            )
            for c in candidates[: total_days * 7]
        ]
        schedule = _flat_to_schedule(fallback_places, total_days)

    # DB 플래그 기반 뱃지 설정
    candidate_map = {c.name: c for c in candidates}
    is_pet_condition        = "반려동물 동반" in condition_values
    is_wheelchair_condition = "휠체어" in condition_values
    print(f"[뱃지] 조건: pet={is_pet_condition}, wheelchair={is_wheelchair_condition}")
    for day_sched in schedule:
        for place in day_sched.places:
            cand = candidate_map.get(place.name)
            accessible_flag = cand.is_accessible if cand else None
            pet_flag        = cand.is_pet_friendly if cand else None
            print(f"[뱃지] {place.name} | is_accessible={accessible_flag} | is_pet_friendly={pet_flag}")
            if is_wheelchair_condition and (cand is None or cand.is_accessible is not True):
                place.accessibility_unconfirmed = True
            if is_pet_condition and (cand is None or cand.is_pet_friendly is not True):
                place.pet_unconfirmed = True

    places_from_ai = [p for d in schedule for p in d.places]
    route_segments = _schedule_to_route_segments(schedule, transport_names)

    return RecommendResponse(
        status="completed",
        prompt_preview=rag_prompt,
        schedule=schedule,
        places=places_from_ai,
        route_segments=route_segments,
        insufficient_candidates=insufficient,
        shortage_message=shortage_msg,
        current_radius_km=used_radius_km,
    )
