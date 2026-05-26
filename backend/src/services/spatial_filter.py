"""
services/spatial_filter.py

[RAG Step 2] Spatial Filtering

DB에서 꺼낸 후보 장소들 간의 pairwise 거리를 계산하여,
서로 너무 멀리 떨어진 장소를 제거하고 밀집도 높은 최적 후보 풀을 구성한다.

PostGIS 없이 순수 Python Haversine으로 구현.
"""

import math
from src.schemas.recommend_schema import PlaceCandidate

EARTH_RADIUS_KM = 6371.0


def haversine(p1: PlaceCandidate, p2: PlaceCandidate) -> float:
    """두 PlaceCandidate 사이의 구면거리(km) 반환."""
    lat1, lon1, lat2, lon2 = map(
        math.radians, [p1.lat, p1.lng, p2.lat, p2.lng]
    )
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(min(1.0, a)))


def spatial_filter(
    candidates: list[PlaceCandidate],
    max_pair_dist_km: float = 5.0,
    max_result: int = 20,
) -> list[PlaceCandidate]:
    if not candidates:
        return []

    sorted_cands = sorted(candidates, key=lambda p: p.distance_km)

    cluster: list[PlaceCandidate] = [sorted_cands[0]]
    outliers: list[PlaceCandidate] = []

    for candidate in sorted_cands[1:]:
        fits_cluster = all(
            haversine(candidate, existing) <= max_pair_dist_km
            for existing in cluster
        )
        if fits_cluster:
            cluster.append(candidate)
        else:
            outliers.append(candidate)

    if len(cluster) < max_result and outliers:
        centroid_lat = sum(p.lat for p in cluster) / len(cluster)
        centroid_lng = sum(p.lng for p in cluster) / len(cluster)
        centroid = PlaceCandidate(
            place_pk=-1, name="_centroid",
            lat=centroid_lat, lng=centroid_lng,
            category="", distance_km=0.0,
        )
        outliers_sorted = sorted(outliers, key=lambda p: haversine(p, centroid))
        for o in outliers_sorted:
            if len(cluster) >= max_result:
                break
            cluster.append(o)

    result = sorted(cluster, key=lambda p: p.distance_km)[:max_result]
    print(
        f"[Spatial] 후보 {len(candidates)}개 → "
        f"클러스터 {len(cluster)}개 → 최종 {len(result)}개 반환 "
        f"(max_pair_dist={max_pair_dist_km}km)"
    )
    return result


def auto_radius_km(transport_names: list[str]) -> float:
    """
    이동수단 목록을 기반으로 DB 검색 반경(km)을 자동 결정한다.
    - 도보만: 2km (좁은 범위 밀집)
    - 자전거 포함: 5km
    - 자동차/대중교통 포함: 15km
    """
    t = set(transport_names)
    if "자동차" in t or "대중교통" in t:
        return 15.0
    if "자전거" in t:
        return 5.0
    return 2.0  # 도보 전용


def auto_max_pair_dist_km(transport_names: list[str]) -> float:
    """
    이동수단 목록을 기반으로 장소 간 허용 최대 거리(km)를 자동 결정한다.
    - 도보만: 1.5km
    - 자전거 포함: 4km
    - 자동차/대중교통 포함: 10km
    """
    t = set(transport_names)
    if "자동차" in t or "대중교통" in t:
        return 10.0
    if "자전거" in t:
        return 4.0
    return 1.5  # 도보 전용
