"""
services/tour_api.py

한국관광공사 TourAPI (KorService1) 연동 모듈.

- fetch_tourapi_nearby      : 일반 관광지·음식점 등 주변 장소 조회 (locationBasedList1)
- fetch_tourapi_pet         : 반려동물 동반 가능 장소 조회 (petTour1)
- fetch_tourapi_barrier_free: 무장애 관광지 근사 조회 (locationBasedList1, 관광지+문화시설)

반환 형식은 place_crud.bulk_upsert_places()가 받는 dict 리스트와 동일.
"""

import asyncio
import httpx
import os

TOUR_API_BASE = "http://apis.data.go.kr/B551011/KorService1"

# 테마 → TourAPI contentTypeId 매핑
THEME_TO_CONTENT_TYPE: dict[str, int] = {
    "힐링":    12,  # 관광지
    "맛집":    39,  # 음식점
    "사진":    12,  # 관광지
    "전시":    14,  # 문화시설
    "체험":    28,  # 레포츠
    "카페":    39,  # 음식점
    "오락/레저": 28, # 레포츠
    "역사":    14,  # 문화시설
    "문화":    14,  # 문화시설
    "쇼핑":    38,  # 쇼핑
    "축제":    15,  # 축제공연행사
    "자연":    12,  # 관광지
}

CONTENT_TYPE_TO_CATEGORY: dict[int, str] = {
    12: "관광명소",
    14: "문화/역사",
    15: "축제",
    28: "체험/레포츠",
    38: "쇼핑",
    39: "맛집",
}


async def _call_tour_api(endpoint: str, extra_params: dict) -> list[dict]:
    api_key = os.getenv("TOUR_API_KEY", "").strip()
    if not api_key:
        print("[TourAPI] TOUR_API_KEY 없음 — 건너뜀")
        return []

    params = {
        "serviceKey": api_key,
        "numOfRows":  20,
        "pageNo":     1,
        "MobileOS":   "ETC",
        "MobileApp":  "GONYADI",
        "_type":      "json",
        **extra_params,
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"{TOUR_API_BASE}/{endpoint}", params=params)
            resp.raise_for_status()

        body = resp.json().get("response", {}).get("body", {})
        items = body.get("items") or {}
        item_list = items.get("item", [])
        if isinstance(item_list, dict):
            item_list = [item_list]
        return item_list

    except Exception as e:
        print(f"[TourAPI] {endpoint} 호출 실패: {e}")
        return []


def _parse_items(items: list[dict], default_category: str) -> list[dict]:
    results = []
    seen_names: set[str] = set()
    for item in items:
        try:
            name = item.get("title", "").strip()
            lat  = float(item.get("mapy", 0))
            lng  = float(item.get("mapx", 0))
            if not name or lat == 0.0 or lng == 0.0 or name in seen_names:
                continue
            seen_names.add(name)

            ct = item.get("contenttypeid")
            category = CONTENT_TYPE_TO_CATEGORY.get(int(ct), default_category) if ct else default_category

            results.append({
                "name":            name,
                "lat":             lat,
                "lng":             lng,
                "category":        category,
                "google_place_id": None,
                "address":         item.get("addr1", ""),
                "rating":          None,
            })
        except (ValueError, TypeError):
            continue
    return results


async def fetch_tourapi_nearby(
    lat: float,
    lng: float,
    radius_m: float,
    theme_names: list[str],
    max_count: int = 20,
) -> list[dict]:
    """일반 관광 정보 — 테마별 contentTypeId로 locationBasedList1 호출."""
    ct_ids = list({THEME_TO_CONTENT_TYPE[t] for t in theme_names if t in THEME_TO_CONTENT_TYPE})
    # 현실적 일정을 위해 음식점(39)과 관광지(12)는 테마와 무관하게 항상 포함
    ct_ids = list({*ct_ids, 39, 12})

    if ct_ids:
        # 최대 3개 타입 병렬 조회 (API 부하 최소화)
        tasks = [
            _call_tour_api("locationBasedList1", {
                "mapX": lng, "mapY": lat,
                "radius": int(radius_m),
                "contentTypeId": ct_id,
                "numOfRows": 10,
            })
            for ct_id in ct_ids[:3]
        ]
        results_nested = await asyncio.gather(*tasks, return_exceptions=True)
        raw = []
        for r in results_nested:
            if isinstance(r, list):
                raw.extend(r)
    else:
        raw = await _call_tour_api("locationBasedList1", {
            "mapX": lng, "mapY": lat,
            "radius": int(radius_m),
            "numOfRows": max_count,
        })

    results = _parse_items(raw, "관광명소")
    print(f"[TourAPI] locationBasedList1 {len(results)}개 수신")
    return results[:max_count]


async def fetch_tourapi_pet(
    lat: float,
    lng: float,
    radius_m: float,
    max_count: int = 20,
) -> list[dict]:
    """반려동물 동반 가능 장소 — petTour1."""
    raw = await _call_tour_api("petTour1", {
        "mapX": lng, "mapY": lat,
        "radius": int(radius_m),
        "numOfRows": max_count,
    })
    results = _parse_items(raw, "반려동물 동반")
    print(f"[TourAPI] petTour1 {len(results)}개 수신")
    return results


async def _get_barrier_free_details_batch(content_ids: list[str]) -> dict[str, dict]:
    """detailWithTour1으로 contentId별 무장애 상세 정보를 일괄 조회한다."""
    async def _fetch_one(cid: str) -> tuple[str, dict | None]:
        items = await _call_tour_api("detailWithTour1", {"contentId": cid})
        return cid, items[0] if items else None

    results = await asyncio.gather(*[_fetch_one(cid) for cid in content_ids], return_exceptions=True)
    detail_map: dict[str, dict] = {}
    for r in results:
        if isinstance(r, tuple):
            cid, detail = r
            if detail:
                detail_map[cid] = detail
    return detail_map


# detailWithTour1이 반환하는 무장애 접근성 필드 (하나라도 있으면 접근 가능으로 판단)
_ACCESSIBILITY_FIELDS = ("wheelchair", "elevator", "parkinglot", "route", "exit")


async def fetch_tourapi_barrier_free(
    lat: float,
    lng: float,
    radius_m: float,
    max_count: int = 20,
) -> list[dict]:
    """
    무장애 관광 조회.
    1. locationBasedList1으로 주변 관광지(12) + 문화시설(14) 목록 조회
    2. detailWithTour1으로 실제 무장애 접근성 정보(휠체어·엘리베이터 등) 확인
    3. 접근성 데이터가 있는 장소만 반환 (없으면 전체 목록 폴백)
    """
    tasks = [
        _call_tour_api("locationBasedList1", {
            "mapX": lng, "mapY": lat,
            "radius": int(radius_m),
            "contentTypeId": 12,
            "numOfRows": 15,
        }),
        _call_tour_api("locationBasedList1", {
            "mapX": lng, "mapY": lat,
            "radius": int(radius_m),
            "contentTypeId": 14,
            "numOfRows": 10,
        }),
    ]
    results_nested = await asyncio.gather(*tasks, return_exceptions=True)
    raw: list[dict] = []
    for r in results_nested:
        if isinstance(r, list):
            raw.extend(r)

    if not raw:
        print("[TourAPI] 무장애: 주변 장소 없음")
        return []

    # contentId 추출 (API 부하 최소화 위해 최대 8개)
    content_ids = [str(item["contentid"]) for item in raw if item.get("contentid")][:8]
    detail_map = await _get_barrier_free_details_batch(content_ids)

    # 접근성 정보 있는 장소 우선 필터링
    accessible_ids: set[str] = {
        cid for cid, d in detail_map.items()
        if any(d.get(f) for f in _ACCESSIBILITY_FIELDS)
    }

    # 접근성 확인된 장소가 3개 미만이면 전체 목록 사용 (폴백)
    use_all = len(accessible_ids) < 3

    results = []
    seen_names: set[str] = set()
    for item in raw:
        cid = str(item.get("contentid", ""))
        if not use_all and cid not in accessible_ids:
            continue
        try:
            name = item.get("title", "").strip()
            lat_p = float(item.get("mapy", 0))
            lng_p = float(item.get("mapx", 0))
            if not name or lat_p == 0.0 or lng_p == 0.0 or name in seen_names:
                continue
            seen_names.add(name)
            ct = item.get("contenttypeid")
            category = CONTENT_TYPE_TO_CATEGORY.get(int(ct), "무장애 관광") if ct else "무장애 관광"
            results.append({
                "name":            name,
                "lat":             lat_p,
                "lng":             lng_p,
                "category":        category,
                "google_place_id": None,
                "address":         item.get("addr1", ""),
                "rating":          None,
            })
        except (ValueError, TypeError):
            continue

    label = "접근성 확인" if not use_all else "폴백(전체)"
    print(f"[TourAPI] 무장애 조회: 전체 {len(raw)}개 → {label} {len(results)}개 수신")
    return results[:max_count]
