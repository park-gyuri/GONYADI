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


# ── 내부 유틸: 안전한 float 변환 ───────────────────────────────────────────
def _safe_float(value) -> Optional[float]:
    """None 또는 변환 불가 값을 안전하게 float으로 변환한다."""
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# ── 내부 유틸: Haversine 직선 거리 (m) ──────────────────────────────────
import math

def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """WGS84 직선 거리 (m). ODsay 호출 전 군소 여부 판단용."""
    R = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi   = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── 내부 유틸: TMAP 도보 결과를 대중교통 폴백 형식으로 변환 ─────────────────
def _build_walking_fallback_transit(
    walk_info: dict,
    origin_lat: float, origin_lng: float,
    dest_lat:   float, dest_lng:   float,
) -> dict:
    """
    TMAP 도보 API 결과를 ODsay transit 형식으로 매핑.
    프론트에서는 trafficType=3 도보 구간으로 렌더링됨.
    """
    duration_min  = walk_info.get("duration_minutes", 0)
    distance_m    = walk_info.get("distance_meters", 0)
    polyline      = walk_info.get("polyline", [])  # [[lat, lng], ...]
    duration_sec  = int(walk_info.get("duration_seconds", int(duration_min * 60)))

    return {
        "travel_mode":        "transit",
        "duration_seconds":   duration_sec,
        "duration_minutes":   float(round(duration_min, 1)),
        "distance_meters":    int(distance_m),
        "polyline":           polyline,
        "transit_sub_paths": [{
            "trafficType":  3,
            "sectionTime":  int(round(duration_min)),
            "distance":     int(distance_m),
            "stationCount": None,
            "startName":    None,
            "endName":      None,
            "way":          None,
            "lane":         [],
            "polyline":     polyline,
            "startX":       origin_lng,
            "startY":       origin_lat,
            "endX":         dest_lng,
            "endY":         dest_lat,
        }],
        "transit_total_walk": int(distance_m),
        "transit_payment":    0,
        # 폴백 실행 시 상태 표시용 필드
        "transit_status":  "walking_fallback",
        "transit_message": "가까운 거리라 도보 경로를 안내합니다.",
    }

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


# ── 대중교통 경로 (ODsay API) ────────────────────────────
ODSAY_TRANSIT_URL = "https://api.odsay.com/v1/api/searchPubTransPathT"


def _build_subpath_polyline(sub: dict) -> list[list[float]]:
    """
    ODsay subPath 하나(지하철/버스)에서 지도 렌더링용 [[lat, lng], ...] 좌표를 생성.

    trafficType 1(지하철) / 2(버스) 전용 — passStopList.stations 좌표 사용.
    ─────────────────────────────────────────────────────────────────────
    ✔ loadLane API 도입 시 이 함수 내부만 교체하면 됨 (시그니처 무변).
    ─────────────────────────────────────────────────────────────────────
    """
    stations = sub.get("passStopList", {}).get("stations", [])
    coords: list[list[float]] = []
    for st in stations:
        try:
            lat = float(st.get("y", 0))
            lng = float(st.get("x", 0))
            if lat and lng:
                coords.append([round(lat, 6), round(lng, 6)])
        except (TypeError, ValueError):
            continue
    return coords


def _get_transit_station_coord(sub: dict, first: bool) -> list[float] | None:
    """
    trafficType 1/2 subPath의 첫 번째(first=True) 또는 마지막 정류장 좌표를 반환.
    도보 구간 시작/끝점 추론 용도.
    """
    stations = sub.get("passStopList", {}).get("stations", [])
    if not stations:
        return None
    st = stations[0] if first else stations[-1]
    try:
        lat = float(st.get("y", 0))
        lng = float(st.get("x", 0))
        if lat and lng:
            return [round(lat, 6), round(lng, 6)]
    except (TypeError, ValueError):
        pass
    return None


def _build_all_subpath_polylines(
    sub_paths: list[dict],
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> list[list[list[float]]]:
    """
    ODsay subPath 배열 전체에 대한 구간별 폴리라인 [[lat,lng],...] 리스트를 반환.
    도보 구간(trafficType=3)은 인접 대중교통 구간의 정류장 좌표에서 유추.

    ODsay searchPubTransPathT 응답의 도보 subPath에는
    startX/Y, endX/Y, passStopList가 모두 없음 → 단독 처리 불가 → 컴텍스트 활용.

    반환값: sub_paths와 같은 길이의 리스트. i번째 원소 = i번째 subPath의 [[lat,lng],...]
    """
    n = len(sub_paths)
    result: list[list[list[float]]] = [[] for _ in range(n)]

    for i, sub in enumerate(sub_paths):
        traffic_type = sub.get("trafficType")

        # 지하철(1) / 버스(2): passStopList 좌표
        if traffic_type in (1, 2):
            result[i] = _build_subpath_polyline(sub)
            continue

        # 도보(3): 시작/끝 좌표를 인접 구간에서 유추
        if traffic_type == 3:
            # 시작점: 이전 구간의 마지막 정류장 OR 경로 원점
            if i == 0:
                start_coord = [round(origin_lat, 6), round(origin_lng, 6)]
            else:
                prev = sub_paths[i - 1]
                start_coord = _get_transit_station_coord(prev, first=False)
                if start_coord is None:
                    start_coord = [round(origin_lat, 6), round(origin_lng, 6)]

            # 끝점: 다음 구간의 첫 번째 정류장 OR 경로 도착점
            if i == n - 1:
                end_coord = [round(dest_lat, 6), round(dest_lng, 6)]
            else:
                nxt = sub_paths[i + 1]
                end_coord = _get_transit_station_coord(nxt, first=True)
                if end_coord is None:
                    end_coord = [round(dest_lat, 6), round(dest_lng, 6)]

            result[i] = [start_coord, end_coord]
            print(f"[ODsay] 도보 구간[{i}] 좌표: {start_coord} → {end_coord}")
            continue

    return result


def _parse_odsay_polyline(sub_paths: list) -> list[list[float]]:
    """
    ODsay subPath 배열에서 전체 경로 폴리라인(단일 합산)을 추출한다.
    도보 제외한 지하철/버스 구간만 포함 (기존 allPolylines 호환용으로 유지).
    구간별 색상 렌더링은 _build_all_subpath_polylines() 사용.
    """
    polyline: list[list[float]] = []
    for sub in sub_paths:
        for coord in _build_subpath_polyline(sub):
            polyline.append(coord)
    return polyline


def _get_transit_info(
    origin_lat: float, origin_lng: float,
    dest_lat:   float, dest_lng:   float,
) -> Optional[dict]:
    """
    ODsay API로 대중교통 경로를 조회한다.
    ODSAY_API_KEY 환경변수가 없으면 None을 반환한다.
    """
    odsay_key = os.getenv("ODSAY_API_KEY", "").strip()
    if not odsay_key:
        print("[ODsay] ODSAY_API_KEY 환경변수가 비어 있습니다.")
        return None

    params = {
        "SX":     str(origin_lng),   # 출발지 경도
        "SY":     str(origin_lat),   # 출발지 위도
        "EX":     str(dest_lng),     # 도착지 경도
        "EY":     str(dest_lat),     # 도착지 위도
        "apiKey": odsay_key,
        "output": "json",
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            res = client.get(ODSAY_TRANSIT_URL, params=params)
            res.raise_for_status()

        data = res.json()

        # ODsay 오류 응답 확인 (HTTP 200이지만 error 필드가 있는 경우)
        if "error" in data:
            err = data["error"]
            print(f"[ODsay] 오류 응답: {err.get('message', err)}")
            return None

        paths = data.get("result", {}).get("path", [])
        if not paths:
            print("[ODsay] 대중교통 경로 없음")
            return None

        # 첫 번째 (최적) 경로 사용
        best = paths[0]
        info = best.get("info", {})

        # totalTime은 분 단위 정수로 반환됨 (ODsay 스펙)
        total_time_min   = int(info.get("totalTime", 0))
        total_dist_m     = int(info.get("totalDistance", 0))
        duration_seconds = total_time_min * 60

        # subPath에서 폴리라인 추출 + 구간 상세 정보 수집
        sub_paths = best.get("subPath", [])
        polyline  = _parse_odsay_polyline(sub_paths)

        # subPath 배열을 프론트에 전달할 수 있도록 정제
        # ※ 구간별 폴리라인은 _build_all_subpath_polylines()로 생성
        #   도보 구간 좌표를 인접 정류장에서 유추하려면 전체 컴텍스트가 필요
        #   추후 loadLane API 도입 시 _build_subpath_polyline()만 교체하면 됨
        all_sub_polylines = _build_all_subpath_polylines(
            sub_paths, origin_lat, origin_lng, dest_lat, dest_lng
        )

        parsed_sub_paths = []
        for idx, sub in enumerate(sub_paths):
            traffic_type = sub.get("trafficType")
            lane_raw = sub.get("lane", [])
            lanes = []
            for l in lane_raw:
                lanes.append({
                    "busNo":      l.get("busNo"),
                    "type":       l.get("type"),
                    "name":       l.get("name"),
                    "subwayCode": l.get("subwayCode"),
                })
            sub_polyline = all_sub_polylines[idx]  # 해당 구간 좌표
            parsed_sub_paths.append({
                "trafficType":  traffic_type,
                "sectionTime":  int(sub.get("sectionTime", 0)),
                "distance":     sub.get("distance"),
                "stationCount": sub.get("stationCount"),
                "startName":    sub.get("startName"),
                "endName":      sub.get("endName"),
                "way":          sub.get("way"),
                "lane":         lanes,
                # 지도 렌더링용 좌표 (도보=인접 좌표 유추, 지하철/버스=passStopList)
                "polyline":     sub_polyline,
                # 도보 직선 연결용 원본 좌표 (있으면 저장, 없으면 None)
                "startX":       _safe_float(sub.get("startX")),
                "startY":       _safe_float(sub.get("startY")),
                "endX":         _safe_float(sub.get("endX")),
                "endY":         _safe_float(sub.get("endY")),
            })

        print(f"[ODsay] 대중교통 경로 탐색 완료: {total_time_min}분 / {total_dist_m}m / 폴리라인 {len(polyline)}점 / 구간 {len(parsed_sub_paths)}개")
        return {
            "travel_mode":        "transit",
            "duration_seconds":   duration_seconds,
            "duration_minutes":   float(total_time_min),
            "distance_meters":    total_dist_m,
            "polyline":           polyline,
            "transit_sub_paths":  parsed_sub_paths,
            "transit_total_walk": info.get("totalWalk", 0),
            "transit_payment":    info.get("payment", 0),
        }

    except Exception as e:
        print(f"[ODsay] 대중교통 경로 조회 실패: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"[ODsay] 응답: {e.response.text}")
        # ODsay 예외 시도 도보 폴백
        dist_m = _haversine_m(origin_lat, origin_lng, dest_lat, dest_lng)
        if dist_m < 1_500:
            print(f"[ODsay] 예외 폴백 — 도보 API 호출 ({dist_m:.0f}m)")
            walk = _get_walk_info(origin_lat, origin_lng, dest_lat, dest_lng)
            if walk:
                return _build_walking_fallback_transit(walk, origin_lat, origin_lng, dest_lat, dest_lng)
        return None


# ── ODsay null 시 도보 폴백 포함한 대중교통 조회 래퍼 ─────────────────────
def _get_transit_info_with_fallback(
    origin_lat: float, origin_lng: float,
    dest_lat:   float, dest_lng:   float,
) -> Optional[dict]:
    """
    ODsay 대중교통 경로 조회 래퍼.
    - 700m 이하: ODsay 스킵 → 즐 TMAP 도보 폴백 (쯼터 절약)
    - ODsay null 반환(1500m 이하): TMAP 도보 폴백
    - ODsay null + 1500m 초과: no_route (None)
    """
    dist_m = _haversine_m(origin_lat, origin_lng, dest_lat, dest_lng)

    # 사전 최적화: 700m 이하는 ODsay 스킵
    if dist_m < 700:
        print(f"[Transit] {dist_m:.0f}m — ODsay 스킵, 도보 직접 폴백")
        walk = _get_walk_info(origin_lat, origin_lng, dest_lat, dest_lng)
        if walk:
            fb = _build_walking_fallback_transit(walk, origin_lat, origin_lng, dest_lat, dest_lng)
            fb["transit_message"] = "가까운 거리라 도보 경로를 안내합니다."
            return fb
        return None

    # ODsay 호출
    transit = _get_transit_info(origin_lat, origin_lng, dest_lat, dest_lng)
    if transit is not None:
        return transit  # 정상 대중교통 경로

    # ODsay null — 거리 기준으로 폴백
    if dist_m < 1_500:
        print(f"[Transit] ODsay null + {dist_m:.0f}m — TMAP 도보 폴백")
        walk = _get_walk_info(origin_lat, origin_lng, dest_lat, dest_lng)
        if walk:
            fb = _build_walking_fallback_transit(walk, origin_lat, origin_lng, dest_lat, dest_lng)
            fb["transit_message"] = "이 구간은 대중교통이 없어 도보 경로를 안내합니다."
            return fb

    print(f"[Transit] ODsay null + {dist_m:.0f}m — 경로 없음")
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
            result["transit"] = _get_transit_info_with_fallback(origin_lat, origin_lng, dest_lat, dest_lng)
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
