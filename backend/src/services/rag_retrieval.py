"""
services/rag_retrieval.py

[RAG 파이프라인 오케스트레이터]

Step 1: DB-First Retrieval   — place_crud.retrieve_candidates_by_location
Step 2: Spatial Filtering    — spatial_filter.spatial_filter
Step 3: (Gemini Curation은 gemini.py + prompt_builder.py에서 담당)
Step 4: Fallback             — Google Places API fetch → DB 캐싱 → 재조회

API 레이어(recommend_api.py)에서 이 함수 하나만 호출하면
"DB 후보 풀 + 필터링 완료된 PlaceCandidate 리스트"를 받을 수 있다.
"""

import asyncio
import httpx
import os
from sqlmodel import Session

from src.schemas.recommend_schema import PlaceCandidate, RecommendRequest
from src.services.spatial_filter import (
    spatial_filter,
    auto_radius_km,
    auto_max_pair_dist_km,
)
from src.services.tour_api import (
    fetch_tourapi_nearby,
    fetch_tourapi_pet,
    fetch_tourapi_barrier_free,
)
import src.crud.place_crud as place_crud

# Fallback 임계값: DB 후보가 이보다 적으면 Google Places Fallback 실행
MIN_CANDIDATES = 8

# Google Places Nearby Search (v1) endpoint
GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"

# 테마 → Google Places primaryType 매핑 (대표값만)
THEME_TO_GOOGLE_TYPE: dict[str, str] = {
    "힐링": "spa",
    "맛집": "restaurant",
    "사진": "tourist_attraction",
    "전시": "museum",
    "체험": "amusement_park",
    "카페": "cafe",
    "오락/레저": "amusement_park",
    "역사": "museum",
    "문화": "cultural_center",
    "쇼핑": "shopping_mall",
    "축제": "tourist_attraction",
    "자연": "park",
}

# 테마 → 내부 카테고리 명칭 매핑 (DB category 필드에 저장)
THEME_TO_CATEGORY: dict[str, str] = {
    "힐링": "힐링",
    "맛집": "맛집",
    "사진": "관광명소",
    "전시": "전시",
    "체험": "체험",
    "카페": "카페",
    "오락/레저": "오락/레저",
    "역사": "역사",
    "문화": "문화",
    "쇼핑": "쇼핑",
    "축제": "축제",
    "자연": "자연",
}


async def _fetch_google_places_nearby(
    lat: float,
    lng: float,
    radius_m: float,
    included_types: list[str],
    max_count: int = 20,
) -> list[dict]:
    """
    Google Places API (Nearby Search v1)로 주변 장소를 가져온다.
    반환: [{'name', 'lat', 'lng', 'category', 'google_place_id', 'address'}]
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        print("[Fallback] GOOGLE_MAPS_API_KEY 없음 — Google Places Fallback 건너뜀")
        return []

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.displayName,"
            "places.location,"
            "places.formattedAddress,"
            "places.primaryType"
        ),
    }
    body = {
        "includedTypes": included_types[:50],  # API 최대 50개
        "maxResultCount": min(max_count, 20),
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius_m,
            }
        },
        "languageCode": "ko",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(GOOGLE_PLACES_URL, headers=headers, json=body)
            resp.raise_for_status()
        raw = resp.json().get("places", [])
        results = []
        for p in raw:
            loc = p.get("location", {})
            results.append(
                {
                    "name": p.get("displayName", {}).get("text", ""),
                    "lat": loc.get("latitude", 0.0),
                    "lng": loc.get("longitude", 0.0),
                    "category": p.get("primaryType", "기타"),
                    "google_place_id": p.get("id"),
                    "address": p.get("formattedAddress"),
                    "rating": None,
                }
            )
        print(f"[Fallback] Google Places {len(results)}개 수신")
        return results

    except Exception as e:
        print(f"[Fallback] Google Places 호출 실패: {e}")
        return []


async def retrieve_and_filter_candidates(
    req: RecommendRequest,
    session: Session,
) -> list[PlaceCandidate]:
    """
    RAG 파이프라인 Step 1 + 2 + 4를 통합 실행한다.

    1. center_lat/lng가 있으면 DB-First 조회 (Haversine SQL)
    2. Spatial Filter로 동선 최적 후보 풀 구성
    3. 후보 수가 MIN_CANDIDATES 미만이면:
       - Google Places API로 신규 장소 Fetch
       - DB에 캐싱 (bulk_upsert)
       - 다시 DB 조회 → Spatial Filter
    4. center_lat/lng가 없으면 빈 리스트 반환 (기존 Hallucination 방식 fallback)

    Returns:
        list[PlaceCandidate]: 필터링 완료된 후보 풀 (LLM에게 넘길 데이터)
    """
    transport_names = [t.value for t in req.transports]
    theme_names = [th.value for th in req.themes]

    # center_lat/lng 없으면 RAG 불가 → 빈 리스트 반환 (recommend_api에서 기존 방식 실행)
    if req.center_lat is None or req.center_lng is None:
        print("[RAG] center_lat/lng 없음 → 기존 Gemini 단독 방식으로 fallback")
        return []

    # 검색 반경 결정 (요청에 명시되면 그대로, 없으면 이동수단 기반 자동)
    radius_km = req.radius_km if req.radius_km is not None else auto_radius_km(transport_names)
    max_pair = auto_max_pair_dist_km(transport_names)

    # ── Step 1: DB-First Retrieval ────────────────────────────────────────────
    # 테마 카테고리 + 현실적 일정을 위한 필수 카테고리(맛집) 항상 포함
    categories = [THEME_TO_CATEGORY[t] for t in theme_names if t in THEME_TO_CATEGORY]
    if categories and "맛집" not in categories:
        categories.append("맛집")
    candidates = place_crud.retrieve_candidates_by_location(
        lat=req.center_lat,
        lng=req.center_lng,
        radius_km=radius_km,
        categories=categories if categories else None,  # None이면 필터 미적용
        session=session,
    )

    # ── Step 4: Google Places + TourAPI 보충 ─────────────────────────────────
    # 특수 조건(휠체어·반려동물)이 있으면 DB 후보 수와 무관하게 항상 TourAPI 호출.
    # DB에 접근성 정보가 없으므로 조건 선택 시 반드시 TourAPI로 검증된 데이터 확보.
    condition_values = [c.value for c in req.conditions]
    has_special_condition = bool(condition_values)
    need_fallback = len(candidates) < MIN_CANDIDATES or has_special_condition

    if need_fallback:
        reason = []
        if len(candidates) < MIN_CANDIDATES:
            reason.append(f"DB 후보 {len(candidates)}개 < MIN({MIN_CANDIDATES})")
        if has_special_condition:
            reason.append(f"특수 조건 {condition_values}")
        print(f"[RAG] {' + '.join(reason)} → Google Places + TourAPI 실행 (반경 {radius_km}km)")

        radius_m = radius_km * 1000

        # Google Places 타입 결정 — restaurant 항상 포함
        google_types = list({
            THEME_TO_GOOGLE_TYPE[t]
            for t in theme_names
            if t in THEME_TO_GOOGLE_TYPE
        } | {"restaurant"}) or ["tourist_attraction", "restaurant"]

        # TourAPI 조건별 선택 (반려동물 > 무장애 > 일반)
        if "반려동물 동반" in condition_values:
            tour_task = fetch_tourapi_pet(req.center_lat, req.center_lng, radius_m)
        elif "휠체어" in condition_values:
            tour_task = fetch_tourapi_barrier_free(req.center_lat, req.center_lng, radius_m)
        else:
            tour_task = fetch_tourapi_nearby(req.center_lat, req.center_lng, radius_m, theme_names)

        # Google Places와 TourAPI 병렬 실행
        google_result, tour_result = await asyncio.gather(
            _fetch_google_places_nearby(
                lat=req.center_lat,
                lng=req.center_lng,
                radius_m=radius_m,
                included_types=google_types,
                max_count=20,
            ),
            tour_task,
            return_exceptions=True,
        )

        fetched: list[dict] = []
        if isinstance(google_result, list):
            fetched.extend(google_result)
        if isinstance(tour_result, list):
            fetched.extend(tour_result)

        print(
            f"[RAG] Google Places {len(google_result) if isinstance(google_result, list) else 0}개 + "
            f"TourAPI {len(tour_result) if isinstance(tour_result, list) else 0}개 → 합계 {len(fetched)}개"
        )

        if fetched:
            # DB에 캐싱
            place_crud.bulk_upsert_places(fetched, session)

            # 캐싱 후 재조회 (새로 저장된 장소 포함)
            candidates = place_crud.retrieve_candidates_by_location(
                lat=req.center_lat,
                lng=req.center_lng,
                radius_km=radius_km,
                categories=None,
                session=session,
            )

    # ── Step 2: Spatial Filtering ─────────────────────────────────────────────
    filtered = spatial_filter(
        candidates=candidates,
        max_pair_dist_km=max_pair,
        max_result=20,
    )

    return filtered
