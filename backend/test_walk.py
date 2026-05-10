# -*- coding: utf-8 -*-
"""
도보(walk) 단일 테스트 - 빠른 검증용
"""
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

payload = {
    "region": "경복궁",
    "nights": 0,
    "days": 1,
    "number_of_people": 2,
    "transports": ["도보"],
    "themes": ["역사"],
    "conditions": [],
    "user_message": "경복궁 근처 도보로 이동 가능한 코스 추천해줘"
}

print("=== 도보 모드 테스트 ===")
resp = httpx.post(f"{BASE_URL}/recommend", json=payload, timeout=90)
print(f"HTTP: {resp.status_code}")

if resp.status_code == 200:
    data = resp.json()
    places = data.get("places", [])
    segments = data.get("route_segments", [])
    print(f"장소 수: {len(places)}")
    for p in places:
        print(f"  - {p['name']} ({p['lat']}, {p['lng']})")
    print(f"구간 수: {len(segments)}")
    for seg in segments:
        print(f"  {seg['from_name']} -> {seg['to_name']}")
        for mode, route in seg["routes"].items():
            if route:
                poly = len(route.get("polyline", []))
                print(f"    [{mode}] {route['duration_minutes']}min / {route['distance_meters']}m / polyline:{poly}pt")
                if poly > 0:
                    print(f"      first coord: {route['polyline'][0]}")
            else:
                print(f"    [{mode}] None")
else:
    print(resp.text[:1000])
