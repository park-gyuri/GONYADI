# backend/src/services/google_places.py
import httpx
import json
import os
from datetime import datetime
from typing import Optional

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"


def enrich_place_from_google(name: str, lat: float, lng: float) -> Optional[dict]:
    """
    Gemini가 준 장소명 + 좌표로 Google Places 검색해서
    google_place_id, address, rating, opening_hours 반환.
    실패 시 None 반환 (보정 실패해도 장소 저장은 계속 진행).
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    
    # 보안을 위해 앞부분 4자리만 출력
    masked_key = f"{api_key[:4]}***" if api_key else "None"
    print(f"[DEBUG] Google Maps API 키 확인 (GOOGLE_MAPS_API_KEY): '{masked_key}'")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "places.id,"
            "places.formattedAddress," 
            
        ),
        # 원래 위 괄호 안에 있어야 하는데 구글 맵스 비용 문제로 잠시 빼둠
        #"places.rating," # 별점
        #"places.currentOpeningHours" # 영업시간
    }
    body = {
        "textQuery": name,
        "locationBias": { # 좌표 기준으로 검색 범위 제한 (강제가 아닌 우선)
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 500.0  # 반경 500m로 검색 범위 제한
            }
        },
        "maxResultCount": 1, # 가장 관련성 높은 결과 1개만 가져오기
        "languageCode": "ko", # 한국어로 응답 받기
    }

    # API 호출 
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.post(PLACES_URL, headers=headers, json=body)
            res.raise_for_status()

        results = res.json().get("places", [])
        if not results:
            print(f"[Google Places] '{name}' 검색 결과 없음")
            return None

        p = results[0]
        hours = p.get("currentOpeningHours", {}).get("weekdayDescriptions", [])

        return {
            "google_place_id": p.get("id"),
            "address":         p.get("formattedAddress"),
            "rating":          p.get("rating"),
            "opening_hours":   json.dumps(hours, ensure_ascii=False),
        }

    # 수정 후
    except Exception as e:
        print(f"[Google Places] '{name}' 보정 실패: {e}")
        # 403일 때 Google이 준 실제 에러 메시지 출력
        if hasattr(e, 'response') and e.response is not None:
            print(f"[Google Places] 응답 내용: {e.response.text}")
        return None