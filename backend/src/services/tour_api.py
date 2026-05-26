"""
services/tour_api.py

한국관광공사 TourAPI (KorService1) 연동 모듈.

- fetch_tourapi_nearby      : 일반 관광지·음식점 등 주변 장소 조회 (locationBasedList2)
- fetch_tourapi_pet         : 반려동물 동반 가능 장소 조회 (petTour1)
- fetch_tourapi_barrier_free: 무장애 관광지 조회 (KorWithService2/locationBasedList2)

반환 형식은 place_crud.bulk_upsert_places()가 받는 dict 리스트와 동일.
"""

import asyncio
import httpx
import os
import urllib.parse

TOUR_API_BASE          = "https://apis.data.go.kr/B551011/KorService2"
PET_TOUR_API_BASE      = "https://apis.data.go.kr/B551011/KorPetTourService2"
BARRIER_FREE_API_BASE  = "https://apis.data.go.kr/B551011/KorWithService2"

# 지역명 → TourAPI areaCode 매핑
# areaBasedList2는 좌표 대신 지역코드를 사용하며, 이를 통해 eventStartDate/eventEndDate 필터가 가능
REGION_TO_AREA_CODE: dict[str, int] = {
    # 광역시/특별시/특별자치시
    "서울": 1, "인천": 2, "대전": 3, "대구": 4,
    "광주": 5, "부산": 6, "울산": 7, "세종": 8,
    # 도 단위
    "경기": 31, "강원": 32, "충북": 33, "충남": 34,
    "경북": 35, "경남": 36, "전북": 37, "전남": 38, "제주": 39,
    # 시·군 단위 → 상위 도 코드로 매핑
    "수원": 31, "가평": 31, "평택": 31,
    "춘천": 32, "강릉": 32, "속초": 32, "평창": 32, "양양": 32, "태백": 32,
    "청주": 33, "충주": 33,
    "천안": 34, "공주": 34, "보령": 34, "태안": 34, "아산": 34,
    "포항": 35, "경주": 35, "안동": 35, "구미": 35,
    "창원": 36, "통영": 36, "거제": 36, "남해": 36, "하동": 36, "거창": 36,
    "전주": 37, "군산": 37, "익산": 37,
    "여수": 38, "순천": 38, "목포": 38, "담양": 38, "광양": 38,
    "제주시": 39, "서귀포": 39,
}

# 테마 → TourAPI contentTypeId 매핑
THEME_TO_CONTENT_TYPE: dict[str, int] = {
    "힐링":    12,  # 관광지
    "맛집":    39,  # 음식점
    "사진":    12,  # 관광지
    "전시":    14,  # 문화시설
    "체험":    28,  # 레포츠
    "카페":    39,  # 음식점
    "오락":    28,  # 레포츠
    "레저":    28,  # 레포츠
    "역사":    14,  # 문화시설
    "문화":    14,  # 문화시설
    "쇼핑":    38,  # 쇼핑
    "축제":    15,  # 축제공연행사
    "자연":    12,  # 관광지
}

CONTENT_TYPE_TO_CATEGORY: dict[int, str] = {
    12: "관광명소",    # THEME_TO_CATEGORY: 사진·힐링·자연
    14: "문화/역사",  # THEME_TO_CATEGORY: 역사·문화·전시
    15: "축제",       # THEME_TO_CATEGORY: 축제
    28: "체험/레포츠",# THEME_TO_CATEGORY: 체험·오락·레저
    38: "쇼핑",       # THEME_TO_CATEGORY: 쇼핑
    39: "맛집",       # THEME_TO_CATEGORY: 맛집
}


async def _call_api(base_url: str, endpoint: str, extra_params: dict) -> list[dict]:
    api_key = os.getenv("TOUR_API_KEY", "").strip()
    if not api_key:
        print(f"[TourAPI] TOUR_API_KEY 없음 — 건너뜀")
        return []

    other_params = {
        "numOfRows": 20,
        "pageNo":    1,
        "MobileOS":  "ETC",
        "MobileApp": "GONYADI",
        "_type":     "json",
        **extra_params,
    }
    query_string = urllib.parse.urlencode(other_params)
    url = f"{base_url}/{endpoint}?serviceKey={api_key}&{query_string}"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
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


async def _call_tour_api(endpoint: str, extra_params: dict) -> list[dict]:
    return await _call_api(TOUR_API_BASE, endpoint, extra_params)


async def _call_barrier_free_api(endpoint: str, extra_params: dict) -> list[dict]:
    return await _call_api(BARRIER_FREE_API_BASE, endpoint, extra_params)



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
    """일반 관광 정보 — 테마별 contentTypeId로 locationBasedList2 호출."""
    ct_ids = list({THEME_TO_CONTENT_TYPE[t] for t in theme_names if t in THEME_TO_CONTENT_TYPE})
    # 관광지(12)는 기본 풀 확보용으로 항상 포함
    # 음식점(39)은 맛집 테마를 선택한 경우에만 포함 (선택하지 않았을 때 식당 과잉 방지)
    ct_ids = list({*ct_ids, 12})
    if "맛집" in theme_names:
        ct_ids.append(39)

    if ct_ids:
        # 최대 3개 타입 병렬 조회 (API 부하 최소화)
        tasks = [
            _call_tour_api("locationBasedList2", {
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
        raw = await _call_tour_api("locationBasedList2", {
            "mapX": lng, "mapY": lat,
            "radius": int(radius_m),
            "numOfRows": max_count,
        })

    results = _parse_items(raw, "관광명소")
    print(f"[TourAPI] locationBasedList2 {len(results)}개 수신")
    return results[:max_count]


async def fetch_tourapi_pet(
    lat: float,
    lng: float,
    radius_m: float,
    max_count: int = 20,
) -> list[dict]:
    """반려동물 동반 가능 장소 — KorPetTourService2 / petTourLocationBasedList2."""
    api_key = os.getenv("TOUR_API_KEY", "").strip()
    if not api_key:
        print("[TourAPI] TOUR_API_KEY 없음 — petTour 건너뜀")
        return []

    other_params = {
        "numOfRows": max_count,
        "pageNo":    1,
        "MobileOS":  "ETC",
        "MobileApp": "GONYADI",
        "_type":     "json",
        "mapX":      lng,
        "mapY":      lat,
        "radius":    int(radius_m),
        "arrange":   "E",  # 거리순
    }
    query_string = urllib.parse.urlencode(other_params)
    url = f"{PET_TOUR_API_BASE}/locationBasedList2?serviceKey={api_key}&{query_string}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        body = resp.json().get("response", {}).get("body", {})
        items = body.get("items") or {}
        item_list = items.get("item", [])
        if isinstance(item_list, dict):
            item_list = [item_list]
    except Exception as e:
        print(f"[TourAPI] KorPetTourService2/locationBasedList2 호출 실패: {e}")
        return []

    results = _parse_items(item_list, "반려동물 동반")
    for r in results:
        r["is_pet_friendly"] = True
    print(f"[TourAPI] KorPetTourService2/locationBasedList2 {len(results)}개 수신")
    return results


async def fetch_tourapi_festivals(
    lat: float,
    lng: float,
    radius_m: float,
    region: str,
    start_date: str | None = None,
    end_date: str | None = None,
    max_count: int = 20,
) -> list[dict]:
    """
    축제 전용 조회.

    - start_date/end_date(YYYYMMDD)가 있으면 areaBasedList2 + 날짜 필터 사용
      → 해당 기간에 실제로 열리는 축제만 반환 (정확)
    - 날짜 없으면 locationBasedList2(contentTypeId=15) 사용
      → 현재 기준 진행 중인 축제를 반경 내에서 조회 (날짜 무보장)

    반환 dict에 festival_start_date, festival_end_date 포함.
    """
    import math

    def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        R = 6371.0
        la1, lo1, la2, lo2 = map(math.radians, [lat1, lng1, lat2, lng2])
        a = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
        return 2 * R * math.asin(math.sqrt(min(1.0, a)))

    def _parse_festival_items(items: list[dict]) -> list[dict]:
        results = []
        seen: set[str] = set()
        for item in items:
            try:
                name = item.get("title", "").strip()
                lat_p = float(item.get("mapy", 0))
                lng_p = float(item.get("mapx", 0))
                if not name or lat_p == 0.0 or lng_p == 0.0 or name in seen:
                    continue
                seen.add(name)
                results.append({
                    "name":                name,
                    "lat":                 lat_p,
                    "lng":                 lng_p,
                    "category":            "축제",
                    "google_place_id":     None,
                    "address":             item.get("addr1", ""),
                    "rating":              None,
                    "festival_start_date": item.get("eventstartdate") or None,
                    "festival_end_date":   item.get("eventenddate") or None,
                })
            except (ValueError, TypeError):
                continue
        return results

    # ── 날짜 있음: areaBasedList2 + eventStartDate/eventEndDate 필터 ──────────
    if start_date and end_date:
        # 지역명에서 areaCode 추출 (첫 매칭 키 사용)
        area_code = next(
            (code for key, code in REGION_TO_AREA_CODE.items() if key in region),
            None
        )
        if area_code:
            raw = await _call_tour_api("areaBasedList2", {
                "contentTypeId":  15,
                "areaCode":       area_code,
                "eventStartDate": start_date,
                "eventEndDate":   end_date,
                "numOfRows":      50,  # 도 단위라 많이 받고 후필터
                "arrange":        "A",  # 제목순
            })
            parsed = _parse_festival_items(raw)
            # 반경 초과 장소 후필터 (areaBasedList2는 좌표 제한 없음)
            radius_km = radius_m / 1000
            filter_km = max(radius_km * 1.5, 30.0)
            parsed = [
                p for p in parsed
                if _haversine_km(lat, lng, p["lat"], p["lng"]) <= filter_km
            ]
            print(
                f"[TourAPI 축제] areaBasedList2(areaCode={area_code}) "
                f"{start_date}~{end_date} → {len(parsed)}개 (반경 {filter_km:.0f}km 이내)"
            )
            return parsed[:max_count]
        else:
            print(f"[TourAPI 축제] '{region}' → areaCode 매핑 없음, locationBasedList2로 fallback")

    # ── 날짜 없음 또는 areaCode 미매칭: locationBasedList2 ─────────────────────
    raw = await _call_tour_api("locationBasedList2", {
        "mapX":          lng,
        "mapY":          lat,
        "radius":        int(radius_m),
        "contentTypeId": 15,
        "numOfRows":     max_count,
    })
    parsed = _parse_festival_items(raw)
    print(f"[TourAPI 축제] locationBasedList2(날짜미지정) → {len(parsed)}개")
    return parsed[:max_count]


async def fetch_tourapi_barrier_free(
    lat: float,
    lng: float,
    radius_m: float,
    max_count: int = 20,
) -> list[dict]:
    """
    무장애 관광 조회 — KorWithService2/locationBasedList2.
    이 API는 무장애 인증 장소만 반환하므로 별도 접근성 검증 불필요.
    모든 결과에 is_accessible=True를 부여한다.
    """
    raw = await _call_barrier_free_api("locationBasedList2", {
        "mapX": lng, "mapY": lat,
        "radius": int(radius_m),
        "numOfRows": max_count,
    })

    if not raw:
        print("[TourAPI] 무장애: 주변 장소 없음")
        return []

    results = []
    seen_names: set[str] = set()
    for item in raw:
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
                "is_accessible":   True,
            })
        except (ValueError, TypeError):
            continue

    print(f"[TourAPI] KorWithService2/locationBasedList2 {len(results)}개 수신 (전원 is_accessible=True)")
    return results[:max_count]
