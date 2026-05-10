import httpx

body = {
    "region": "서울 종로구",
    "nights": 0,
    "days": 1,
    "number_of_people": 2,
    "transports": ["자전거", "대중교통"],
    "themes": ["힐링", "카페"]
}

print("--- TMAP API 연동 테스트 ---")
res = httpx.post("http://localhost:8000/api/v1/recommend", json=body, timeout=60)
print(f"상태 코드: {res.status_code}")

if res.status_code == 200:
    d = res.json()
    places = d.get("places", [])
    segments = d.get("route_segments", [])

    print(f"\n[장소] {len(places)}개")
    for p in places:
        print(f"  - {p['name']}")

    print(f"\n[경로 구간] {len(segments)}개")
    for seg in segments:
        print(f"\n  {seg['from_name']} --> {seg['to_name']}")
        routes = seg.get("routes", {})
        for mode, info in routes.items():
            if info:
                poly = info.get("polyline", [])
                print(f"    [{mode}] {info['duration_minutes']}분 / {info['distance_meters']}m / 폴리라인 {len(poly)}개 좌표")
                if poly:
                    print(f"      첫 좌표: {poly[0]}, 마지막: {poly[-1]}")
            else:
                print(f"    [{mode}] 경로 없음 (None)")
else:
    print("에러 응답:", res.text[:800])
