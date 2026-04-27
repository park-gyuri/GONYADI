# -*- coding: utf-8 -*-
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

TESTS = [
    {
        "name": "도보(walk) 모드",
        "payload": {
            "region": "경복궁",
            "nights": 0,
            "days": 1,
            "number_of_people": 2,
            "transports": ["도보"],
            "themes": ["역사"],
            "conditions": [],
            "user_message": "경복궁 근처 도보로 이동 가능한 코스 추천해줘"
        }
    },
    {
        "name": "자동차(drive) 모드",
        "payload": {
            "region": "부산 해운대",
            "nights": 1,
            "days": 2,
            "number_of_people": 2,
            "transports": ["자동차"],
            "themes": ["맛집"],
            "conditions": [],
            "user_message": ""
        }
    },
    {
        "name": "자전거(bicycle) 모드",
        "payload": {
            "region": "제주도",
            "nights": 1,
            "days": 2,
            "number_of_people": 2,
            "transports": ["자전거"],
            "themes": ["힐링"],
            "conditions": [],
            "user_message": ""
        }
    },
    {
        "name": "도보+자동차 복합 모드",
        "payload": {
            "region": "서울 북촌",
            "nights": 0,
            "days": 1,
            "number_of_people": 3,
            "transports": ["도보", "자동차"],
            "themes": ["역사", "카페"],
            "conditions": [],
            "user_message": ""
        }
    },
]

def run_test(name, payload):
    print(f"\n{'='*60}")
    print(f"[TEST] {name}")
    print(f"{'='*60}")
    try:
        resp = httpx.post(f"{BASE_URL}/recommend", json=payload, timeout=90)
        print(f"  HTTP 상태코드: {resp.status_code}")

        if resp.status_code != 200:
            err = resp.json()
            print(f"  [ERROR] {json.dumps(err, ensure_ascii=False, indent=2)[:800]}")
            return

        data = resp.json()
        places = data.get("places", [])
        segments = data.get("route_segments", [])

        print(f"\n  [장소 목록] {len(places)}곳")
        for p in places:
            print(f"    - {p['name']} ({p['lat']}, {p['lng']})")

        print(f"\n  [경로 구간] {len(segments)}개")
        all_ok = True
        for seg in segments:
            frm = seg["from_name"]
            to = seg["to_name"]
            print(f"\n    {frm} -> {to}")
            for mode, route in seg["routes"].items():
                if route is None:
                    print(f"      [{mode}] ❌ None (경로 조회 실패)")
                    all_ok = False
                else:
                    poly_count = len(route.get("polyline", []))
                    poly_status = "✅" if poly_count > 0 else "⚠️  (빈 배열)"
                    print(f"      [{mode}] ✅ {route['duration_minutes']}분 / {route['distance_meters']}m / 폴리라인 {poly_count}개 좌표 {poly_status}")
                    if poly_count > 0:
                        first = route["polyline"][0]
                        last = route["polyline"][-1]
                        print(f"             좌표 예시 — 시작: {first}, 끝: {last}")

        print(f"\n  [종합] {'✅ 전체 통과' if all_ok else '⚠️  일부 실패'}")

    except Exception as e:
        print(f"  [EXCEPTION] {e}")


if __name__ == "__main__":
    print("교통수단별 경로 API 테스트 시작")
    for test in TESTS:
        run_test(test["name"], test["payload"])
    print(f"\n{'='*60}")
    print("테스트 완료")
