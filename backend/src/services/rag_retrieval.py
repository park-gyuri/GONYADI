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
import random
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
    fetch_tourapi_festivals,
)
import src.crud.place_crud as place_crud

# Fallback 임계값: DB 후보가 이보다 적으면 Google Places Fallback 실행
MIN_CANDIDATES = 8


# Google Places Nearby Search (v1) endpoint
GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby"
# Google Places Text Search (v1) endpoint — 장소명 직접 검색
GOOGLE_PLACES_TEXT_URL = "https://places.googleapis.com/v1/places:searchText"

# 테마 → Google Places primaryType 매핑 (대표값만)
THEME_TO_GOOGLE_TYPE: dict[str, str] = {
    "힐링": "spa",
    "맛집": "restaurant",
    "사진": "tourist_attraction",
    "전시": "museum",
    "체험": "amusement_park",
    "카페": "cafe",
    "오락": "bowling_alley",
    "레저": "amusement_park",
    "역사": "museum",
    "문화": "cultural_center",
    "쇼핑": "shopping_mall",
    "축제": "tourist_attraction",
    "자연": "park",
}

# 테마 → DB 조회 카테고리명 매핑
# 반드시 CONTENT_TYPE_TO_CATEGORY(tour_api.py)와 GOOGLE_TYPE_TO_CATEGORY(아래)의 저장값과 일치해야 함
THEME_TO_CATEGORY: dict[str, str] = {
    "힐링": "힐링",
    "맛집": "맛집",
    "사진": "관광명소",
    "전시": "문화/역사",   # TourAPI contentTypeId=14 저장명
    "체험": "체험/레포츠", # TourAPI contentTypeId=28 저장명
    "카페": "카페",
    "오락": "체험/레포츠", # TourAPI contentTypeId=28 저장명
    "레저": "체험/레포츠", # TourAPI contentTypeId=28 저장명
    "역사": "문화/역사",   # TourAPI contentTypeId=14 저장명
    "문화": "문화/역사",   # TourAPI contentTypeId=14 저장명
    "쇼핑": "쇼핑",
    "축제": "축제",
    "자연": "자연",
}

# Google Places primaryType → DB 카테고리 한국어 변환
# _fetch_google_places_nearby 저장 시 영어 타입을 한국어로 변환해 THEME_TO_CATEGORY와 일치시킴
GOOGLE_TYPE_TO_CATEGORY: dict[str, str] = {
    "restaurant":        "맛집",
    "food":              "맛집",
    "cafe":              "카페",
    "coffee_shop":       "카페",
    "bakery":            "카페",
    "spa":               "힐링",
    "tourist_attraction":"관광명소",
    "amusement_park":    "체험/레포츠",
    "bowling_alley":     "체험/레포츠",
    "gym":               "체험/레포츠",
    "stadium":           "체험/레포츠",
    "museum":            "문화/역사",
    "art_gallery":       "문화/역사",
    "cultural_center":   "문화/역사",
    "library":           "문화/역사",
    "park":              "자연",
    "national_park":     "자연",
    "campground":        "자연",
    "beach":             "자연",
    "shopping_mall":     "쇼핑",
    "department_store":  "쇼핑",
    "market":            "쇼핑",
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
            primary_type = p.get("primaryType", "")
            category = GOOGLE_TYPE_TO_CATEGORY.get(primary_type, "관광명소")
            results.append(
                {
                    "name": p.get("displayName", {}).get("text", ""),
                    "lat": loc.get("latitude", 0.0),
                    "lng": loc.get("longitude", 0.0),
                    "category": category,
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


async def _fetch_google_places_text_search(
    query: str,
    lat: float,
    lng: float,
    max_count: int = 5,
) -> list[dict]:
    """
    Google Places Text Search로 사용자가 언급한 장소명을 직접 검색한다.
    구어체·비공식 명칭(예: '남산타워')도 공식 장소(예: 'N서울타워')로 매칭된다.
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
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
        "textQuery": query,
        "maxResultCount": min(max_count, 20),
        "languageCode": "ko",
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 50000.0,  # 50km 이내 우선 (강제 아님)
            }
        },
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(GOOGLE_PLACES_TEXT_URL, headers=headers, json=body)
            resp.raise_for_status()
        raw = resp.json().get("places", [])
        results = []
        for p in raw:
            loc = p.get("location", {})
            results.append({
                "name":            p.get("displayName", {}).get("text", ""),
                "lat":             loc.get("latitude", 0.0),
                "lng":             loc.get("longitude", 0.0),
                "category":        p.get("primaryType", "관광명소"),
                "google_place_id": p.get("id"),
                "address":         p.get("formattedAddress"),
                "rating":          None,
            })
        print(f"[TextSearch] '{query[:40]}' → {len(results)}개 수신")
        return results
    except Exception as e:
        print(f"[TextSearch] 실패: {e}")
        return []


async def retrieve_and_filter_candidates(
    req: RecommendRequest,
    session: Session,
) -> tuple[list[PlaceCandidate], list[PlaceCandidate], float]:
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
        filtered       : Spatial Filter 통과 후보 (최대 20개) — 1차 Gemini 큐레이션용
        pre_filtered   : 랜덤 서브샘플 후보 (최대 30개) — 2차 Gemini 검토·교체용
        used_radius_km : 실제 사용된 검색 반경
        pinned_names   : 사용자 상세 요청에서 언급된 장소 이름 집합

    """
    transport_names = [t.value for t in req.transports]
    theme_names = [th.value for th in req.themes]

    if req.center_lat is None or req.center_lng is None:
        print("[RAG] center_lat/lng 없음 → 기존 Gemini 단독 방식으로 fallback")
        return [], [], 0.0

    # 검색 반경 결정 (요청에 명시되면 그대로, 없으면 이동수단 기반 자동)
    radius_km = req.radius_km if req.radius_km is not None else auto_radius_km(transport_names)
    max_pair = auto_max_pair_dist_km(transport_names)

    # ── Step 1: DB-First Retrieval ────────────────────────────────────────────
    # 중복 제거: 여러 테마가 같은 카테고리로 매핑될 수 있으므로 set으로 정리
    categories = list(dict.fromkeys(
        THEME_TO_CATEGORY[t] for t in theme_names if t in THEME_TO_CATEGORY
    ))
    # 식사 장소는 테마 선택과 무관하게 항상 후보에 포함 (아침/점심/저녁 구조 보장)
    if "맛집" not in categories:
        categories.append("맛집")
    candidates = place_crud.retrieve_candidates_by_location(
        lat=req.center_lat,
        lng=req.center_lng,
        radius_km=radius_km,
        categories=categories if categories else None,
        session=session,
    )

    # ── Step 1.5: user_message에 언급된 장소를 Text Search로 후보에 추가 ──
    # 초기 요청·수정 모드 모두 동작: "남산타워 가고싶어"처럼 구어체·비공식 장소명을
    # Google Places Text Search로 공식 명칭에 매핑해 DB에 추가한다.
    # 핀된 장소는 이후 서브샘플링·Spatial Filter에서 절대 제거되지 않는다.
    pinned_names: set[str] = set()
    if req.user_message.strip():
        text_query = f"{req.region} {req.user_message}"
        mention_results = await _fetch_google_places_text_search(
            query=text_query,
            lat=req.center_lat,
            lng=req.center_lng,
            max_count=5,
        )
        if mention_results:
            saved = place_crud.bulk_upsert_places(mention_results, session)
            # Google Places API 응답 이름이 아닌 DB에 실제 저장된 이름으로 핀 구성
            pinned_names = {p.name for p in saved}
            print(f"[RAG] 핀된 장소 (DB 저장명): {list(pinned_names)}")
            # 넓은 반경으로 재조회 — Text Search 결과가 원래 반경 밖일 수도 있음
            candidates = place_crud.retrieve_candidates_by_location(
                lat=req.center_lat,
                lng=req.center_lng,
                radius_km=max(radius_km, 30.0),
                categories=None,
                session=session,
            )

    # ── Step 4: Google Places + TourAPI 보충 ─────────────────────────────────
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

        # Google Places 타입 결정
        # restaurant는 아침/점심/저녁 구조를 위해 항상 포함
        google_types_set = {
            THEME_TO_GOOGLE_TYPE[t]
            for t in theme_names
            if t in THEME_TO_GOOGLE_TYPE
        }
        google_types_set.add("restaurant")
        google_types = list(google_types_set) or ["tourist_attraction", "restaurant"]

        # TourAPI 조건별 선택 (반려동물 > 무장애 > 일반)
        if "반려동물 동반" in condition_values:
            tour_task = fetch_tourapi_pet(req.center_lat, req.center_lng, radius_m)
        elif "휠체어" in condition_values:
            tour_task = fetch_tourapi_barrier_free(req.center_lat, req.center_lng, radius_m)
        else:
            tour_task = fetch_tourapi_nearby(req.center_lat, req.center_lng, radius_m, theme_names)

        # 축제 테마 선택 시 날짜 필터 전용 태스크 추가 병렬 실행
        has_festival = "축제" in theme_names
        start_date_str = req.start_date.strftime("%Y%m%d") if req.start_date else None
        end_date_str   = req.end_date.strftime("%Y%m%d")   if req.end_date   else None

        if has_festival:
            festival_task = fetch_tourapi_festivals(
                lat=req.center_lat,
                lng=req.center_lng,
                radius_m=radius_m,
                region=req.region,
                start_date=start_date_str,
                end_date=end_date_str,
            )
            google_result, tour_result, festival_result = await asyncio.gather(
                _fetch_google_places_nearby(
                    lat=req.center_lat,
                    lng=req.center_lng,
                    radius_m=radius_m,
                    included_types=google_types,
                    max_count=20,
                ),
                tour_task,
                festival_task,
                return_exceptions=True,
            )
        else:
            festival_result = []
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
        if isinstance(festival_result, list):
            fetched.extend(festival_result)

        print(
            f"[RAG] Google Places {len(google_result) if isinstance(google_result, list) else 0}개 + "
            f"TourAPI {len(tour_result) if isinstance(tour_result, list) else 0}개 + "
            f"축제 {len(festival_result) if isinstance(festival_result, list) else 0}개 → 합계 {len(fetched)}개"
        )

        if fetched:
            place_crud.bulk_upsert_places(fetched, session)
            candidates = place_crud.retrieve_candidates_by_location(
                lat=req.center_lat,
                lng=req.center_lng,
                radius_km=radius_km,
                categories=None,
                session=session,
            )

    # ── Step 4 이후 핀된 장소 복원 ──────────────────────────────────────────────
    # Step 4가 radius_km으로 재조회할 경우 Step 1.5에서 찾은 장소가 사라질 수 있음
    if pinned_names:
        existing_names = {c.name for c in candidates}
        missing = pinned_names - existing_names
        if missing:
            # 더 넓은 반경으로 재조회해 핀된 장소를 복구
            wide_candidates = place_crud.retrieve_candidates_by_location(
                lat=req.center_lat,
                lng=req.center_lng,
                radius_km=max(radius_km, 30.0),
                categories=None,
                session=session,
            )
            recovered = [c for c in wide_candidates if c.name in missing]
            candidates.extend(recovered)
            print(f"[RAG] 핀된 장소 복원: {[c.name for c in recovered]}")

    # ── Step 2: Spatial Filtering ─────────────────────────────────────────────
    # 핀된 장소를 먼저 분리해 서브샘플링에서 제외 → 항상 보존
    pinned_candidates = [c for c in candidates if c.name in pinned_names]
    other_candidates  = [c for c in candidates if c.name not in pinned_names]

    _SUBSAMPLE_SIZE = 30
    sample_size = max(0, _SUBSAMPLE_SIZE - len(pinned_candidates))
    if len(other_candidates) > sample_size:
        other_candidates = random.sample(other_candidates, sample_size)
        print(f"[RAG] 랜덤 서브샘플: {sample_size}개 선택 (핀 {len(pinned_candidates)}개 보존)")

    candidates = pinned_candidates + other_candidates

    # 서브샘플 전체를 보존 — 2차 Gemini 검토 시 교체 후보로 사용
    pre_filtered = list(candidates)

    filtered = spatial_filter(
        candidates=candidates,
        max_pair_dist_km=max_pair,
        max_result=20,
    )

    # Spatial Filter 이후에도 핀된 장소 보존
    if pinned_names:
        filtered_names = {c.name for c in filtered}
        for p in pinned_candidates:
            if p.name not in filtered_names:
                filtered.append(p)
                print(f"[RAG] 핀된 장소 Spatial Filter 후 복원: {p.name}")

    # ── 식사 장소 최소 쿼터 보장 ──────────────────────────────────────────────
    # 하루 구조(아침/점심/저녁)를 위해 일수 × 3개 이상의 식사 장소가 필요
    _MEAL_CATEGORIES = {"맛집", "식당", "음식점", "레스토랑"}
    _MEAL_PER_DAY = 3
    needed_meals = (req.days or 1) * _MEAL_PER_DAY
    current_meal_count = sum(1 for p in filtered if p.category in _MEAL_CATEGORIES)

    if current_meal_count < needed_meals:
        filtered_pks = {p.place_pk for p in filtered}
        extra_meals = [
            p for p in pre_filtered
            if p.category in _MEAL_CATEGORIES and p.place_pk not in filtered_pks
        ]
        shortage = needed_meals - current_meal_count
        filtered.extend(extra_meals[:shortage])
        print(
            f"[RAG] 식사 장소 부족 ({current_meal_count}개 < {needed_meals}개) "
            f"→ pre_filtered에서 {min(shortage, len(extra_meals))}개 보충"
        )

    return filtered, pre_filtered, radius_km, pinned_names
