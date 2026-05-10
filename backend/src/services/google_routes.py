"""
TMAP API (SK 오픈 플랫폼) 기반 경로 탐색 서비스

- 자동차: POST https://apis.openapi.sk.com/tmap/routes?version=1
- 도보  : POST https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1

응답은 GeoJSON FeatureCollection 형식이며,
 - geometry.type == "Point"     → 안내 포인트
 - geometry.type == "LineString"→ 경로 폴리라인 좌표 (경도, 위도)

키 발급: https://openapi.sk.com  (무료 플랜 제공)
"""

import os
import httpx
from typing import Optional
from urllib.parse import quote

# ── 엔드포인트 ─────────────────────────────────────────────────────────────
TMAP_DRIVE_URL   = "https://apis.openapi.sk.com/tmap/routes?version=1"
TMAP_WALK_URL    = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1"
TMAP_TRANSIT_URL = "https://apis.openapi.sk.com/transit/routes"

ORS_CYCLING_URL  = "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson"


# ── 내부 유틸: GeoJSON features에서 소요시간·거리·폴리라인 추출 ──────────────
def _parse_tmap_geojson(features: list) -> dict:
    """
    TMAP GeoJSON features 배열을 파싱하여 요약 정보와 좌표를 반환한다.

    반환:
      {
        "duration_seconds": int,
        "duration_minutes": float,
        "distance_meters" : int,
        "polyline"        : [[lat, lng], ...]  # 프론트 렌더링용 (위도·경도 순)
      }
    """
    duration_seconds = 0
    distance_meters  = 0
    polyline: list[list[float]] = []

    for feature in features:
        geometry   = feature.get("geometry", {})
        properties = feature.get("properties", {})
        geo_type   = geometry.get("type")

        # 첫 번째 Point feature에 totalTime / totalDistance가 들어있음
        if geo_type == "Point" and not duration_seconds:
            raw_time = properties.get("totalTime", 0)      # 초(int)
            raw_dist = properties.get("totalDistance", 0)  # 미터(int)
            if raw_time:
                duration_seconds = int(raw_time)
            if raw_dist:
                distance_meters = int(raw_dist)

        # LineString → 폴리라인 좌표 수집
        elif geo_type == "LineString":
            coords = geometry.get("coordinates", [])  # [[lng, lat], ...]
            for lng, lat in coords:
                polyline.append([round(lat, 6), round(lng, 6)])  # 프론트는 lat,lng 순

    return {
        "duration_seconds": duration_seconds,
        "duration_minutes": round(duration_seconds / 60, 1),
        "distance_meters" : distance_meters,
        "polyline"        : polyline,
    }


# ── 자동차 경로 ───────────────────────────────────────────────────────────
def _get_drive_info(
    origin_lat: float, origin_lng: float,
    dest_lat:   float, dest_lng:   float,
) -> Optional[dict]:
    app_key = os.getenv("TMAP_APP_KEY", "").strip()
    if not app_key:
        print("[TMAP] TMAP_APP_KEY 환경변수가 비어 있습니다.")
        return None

    headers = {
        "appKey":       app_key,
        "Content-Type": "application/json",
        "Accept":       "application/json",
    }
    body = {
        "startX":        str(origin_lng),
        "startY":        str(origin_lat),
        "endX":          str(dest_lng),
        "endY":          str(dest_lat),
        "reqCoordType":  "WGS84GEO",
        "resCoordType":  "WGS84GEO",
        "searchOption":  "0",   # 0: 최적, 4: 무료 우선, 10: 최단
        "trafficInfo":   "Y",   # 실시간 교통 반영
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            res = client.post(TMAP_DRIVE_URL, headers=headers, json=body)
            res.raise_for_status()

        features = res.json().get("features", [])
        if not features:
            print("[TMAP] 자동차 경로 없음")
            return None

        parsed = _parse_tmap_geojson(features)
        return {"travel_mode": "drive", **parsed}

    except Exception as e:
        print(f"[TMAP] 자동차 경로 조회 실패: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"[TMAP] 응답: {e.response.text}")
        return None


# ── 도보 경로 ─────────────────────────────────────────────────────────────
def _get_walk_info(
    origin_lat: float, origin_lng: float,
    dest_lat:   float, dest_lng:   float,
) -> Optional[dict]:
    app_key = os.getenv("TMAP_APP_KEY", "").strip()
    if not app_key:
        print("[TMAP] TMAP_APP_KEY 환경변수가 비어 있습니다.")
        return None

    headers = {
        "appKey":       app_key,
        "Content-Type": "application/json",
        "Accept":       "application/json",
    }
    body = {
        "startX":        str(origin_lng),
        "startY":        str(origin_lat),
        "endX":          str(dest_lng),
        "endY":          str(dest_lat),
        "startName":     quote("출발지"),
        "endName":       quote("도착지"),
        "reqCoordType":  "WGS84GEO",
        "resCoordType":  "WGS84GEO",
        "searchOption":  "0",   # 0: 추천 (단일 옵션)
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            res = client.post(TMAP_WALK_URL, headers=headers, json=body)
            res.raise_for_status()

        features = res.json().get("features", [])
        if not features:
            print("[TMAP] 도보 경로 없음")
            return None

        parsed = _parse_tmap_geojson(features)
        return {"travel_mode": "walk", **parsed}

    except Exception as e:
        print(f"[TMAP] 도보 경로 조회 실패: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"[TMAP] 응답: {e.response.text}")
        return None


# ── 자전거 경로 (ORS API 또는 대체 로직) ─────────────────────────────────────────
def _get_bicycle_info(
    origin_lat: float, origin_lng: float,
    dest_lat:   float, dest_lng:   float,
) -> Optional[dict]:
    
    ors_api_key = os.getenv("ORS_API_KEY", "").strip()
    
    # ORS API 키가 있으면 OpenRouteService (자전거 전용 OSM 알고리즘) 사용
    if ors_api_key:
        headers = {
            "Authorization": ors_api_key,
            "Content-Type": "application/json; charset=utf-8",
        }
        # ORS는 [longitude, latitude] 순서를 사용합니다.
        body = {
            "coordinates": [[origin_lng, origin_lat], [dest_lng, dest_lat]]
        }
        
        try:
            with httpx.Client(timeout=15.0) as client:
                res = client.post(ORS_CYCLING_URL, headers=headers, json=body)
                res.raise_for_status()
                
            data = res.json()
            features = data.get("features", [])
            if not features:
                return None
                
            feature = features[0]
            summary = feature.get("properties", {}).get("summary", {})
            duration_seconds = int(summary.get("duration", 0))
            distance_meters = int(summary.get("distance", 0))
            
            # 폴리라인 좌표 파싱: ORS는 [lng, lat]이므로 카카오맵 등을 위해 [lat, lng]로 변환
            geometry = feature.get("geometry", {})
            polyline = []
            if geometry.get("type") == "LineString":
                coords = geometry.get("coordinates", [])
                for lng, lat in coords:
                    polyline.append([round(lat, 6), round(lng, 6)])
                    
            return {
                "travel_mode": "bicycle",
                "duration_seconds": duration_seconds,
                "duration_minutes": round(duration_seconds / 60, 1),
                "distance_meters": distance_meters,
                "polyline": polyline
            }
            
        except Exception as e:
            print(f"[ORS] 자전거 경로 조회 실패: {e}. 기존 로직(TMAP)으로 대체합니다.")
            if hasattr(e, "response") and e.response is not None:
                print(f"[ORS] 응답: {e.response.text}")
            # 조회 실패 시 그대로 아래의 TMAP 우회 로직으로 흘러갑니다.

    # ─────────────────────────────────────────────────────────────
    # ORS 키가 없거나 에러 발생 시: TMAP 보행자 API를 자전거 속도로 보정 (Fallback)
    walk_info = _get_walk_info(origin_lat, origin_lng, dest_lat, dest_lng)
    if not walk_info:
        return None

    distance_m = walk_info["distance_meters"]
    duration_seconds = int(distance_m / 4.16) # 자전거 속도(약 15km/h)로 시간 재계산

    return {
        "travel_mode": "bicycle",
        "duration_seconds": duration_seconds,
        "duration_minutes": round(duration_seconds / 60, 1),
        "distance_meters": distance_m,
        "polyline": walk_info.get("polyline", [])
    }


# ── 대중교통 경로 ──────────────────────────────────────────────────────────
def _get_transit_info(
    origin_lat: float, origin_lng: float,
    dest_lat:   float, dest_lng:   float,
) -> Optional[dict]:
    app_key = os.getenv("TMAP_APP_KEY", "").strip()
    if not app_key:
        return None

    headers = {
        "appKey":       app_key,
        "Content-Type": "application/json",
        "Accept":       "application/json",
    }
    body = {
        "startX": str(origin_lng),
        "startY": str(origin_lat),
        "endX":   str(dest_lng),
        "endY":   str(dest_lat),
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            res = client.post(TMAP_TRANSIT_URL, headers=headers, json=body)
            # 대중교통 API 권한이 없는 키(403)인 경우
            if res.status_code == 403:
                print("[TMAP] 대중교통 API 권한 없음(403). 사용 중인 App Key에 '대중교통 길찾기' 상품이 추가되어 있는지 확인하세요.")
                return None
            res.raise_for_status()

        data = res.json()
        itineraries = data.get("metaData", {}).get("plan", {}).get("itineraries", [])
        if not itineraries:
            print("[TMAP] 대중교통 경로 없음")
            return None

        # 가장 첫 번째(최적) 경로 추출
        best_route = itineraries[0]
        duration_seconds = best_route.get("totalTime", 0)
        distance_meters  = best_route.get("totalDistance", 0)

        # 대중교통은 여러 구간(도보, 지하철, 버스)의 집합이라 폴리라인 추출이 복잡하므로 
        # 일단 빈 배열을 반환 (필요시 legs 기반으로 폴리라인 파싱 로직 추가 가능)
        polyline = []

        return {
            "travel_mode": "transit",
            "duration_seconds": duration_seconds,
            "duration_minutes": round(duration_seconds / 60, 1),
            "distance_meters": distance_meters,
            "polyline": polyline
        }

    except Exception as e:
        print(f"[TMAP] 대중교통 경로 조회 실패: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"[TMAP] 응답: {e.response.text}")
        return None


# ── 공개: 여러 이동수단 한 번에 조회 ─────────────────────────────────────
def get_route_between_places(
    origin_lat: float,
    origin_lng: float,
    dest_lat:   float,
    dest_lng:   float,
    travel_modes: list[str],  # ["도보", "자동차", "자전거", "대중교통"] 등
) -> dict:
    """
    여러 이동수단에 대해 경로 정보를 조회한다 (TMAP API 사용).
    """
    result: dict = {}

    for mode_ko in travel_modes:
        if mode_ko == "자동차":
            result["drive"] = _get_drive_info(origin_lat, origin_lng, dest_lat, dest_lng)
        elif mode_ko == "도보":
            result["walk"] = _get_walk_info(origin_lat, origin_lng, dest_lat, dest_lng)
        elif mode_ko == "자전거":
            result["bicycle"] = _get_bicycle_info(origin_lat, origin_lng, dest_lat, dest_lng)
        elif mode_ko == "대중교통":
            result["transit"] = _get_transit_info(origin_lat, origin_lng, dest_lat, dest_lng)
        else:
            print(f"[TMAP] 미지원 이동수단 (건너뜀): {mode_ko}")

    return result


# ── 공개: 장소 목록 순서대로 인접 쌍 경로 계산 ────────────────────────────
def build_route_segments(
    places: list,            # list[PlaceResult]
    travel_modes: list[str], # 한국어 이동수단 목록
) -> list[dict]:
    """
    장소 목록의 인접한 두 장소 쌍 사이의 경로 정보를 순서대로 반환한다.

    Returns:
        [
            {
                "from_name": "경복궁",
                "to_name"  : "북촌한옥마을",
                "routes": {
                    "walk" : {"duration_seconds": 720, "duration_minutes": 12.0,
                              "distance_meters": 950, "polyline": [[37.5, 126.9], ...]},
                    "drive": {"duration_seconds": 180, "duration_minutes": 3.0,
                              "distance_meters": 1050, "polyline": [[37.5, 126.9], ...]},
                }
            },
            ...
        ]
    """
    segments: list[dict] = []

    for i in range(len(places) - 1):
        origin = places[i]
        dest   = places[i + 1]

        print(f"[TMAP] 경로 계산: {origin.name} → {dest.name} | 수단: {travel_modes}")

        routes = get_route_between_places(
            origin_lat=origin.lat,
            origin_lng=origin.lng,
            dest_lat=dest.lat,
            dest_lng=dest.lng,
            travel_modes=travel_modes,
        )

        segments.append({
            "from_name": origin.name,
            "to_name":   dest.name,
            "routes":    routes,
        })

    return segments
