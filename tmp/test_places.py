
import os
import sys
from dotenv import load_dotenv

# sys.path에 backend 디렉토리 추가
sys.path.append(os.path.join(os.getcwd(), "backend"))

from src.services.google_places import enrich_place_from_google

def test_google_places():
    # .env 파일 로드
    load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))
    
    print(f"DEBUG: GOOGLE_MAPS_API_KEY extracted from .env: {os.getenv('GOOGLE_MAPS_API_KEY')[:4]}...")
    
    # 샘플 장소명
    name = "메르시앤"
    lat = 35.917646
    lng = 128.802821
    
    print(f"--- '{name}' 검색 테스트 시작 ---")
    result = enrich_place_from_google(name, lat, lng)
    
    if result:
        print("결과 확인 성공!")
        print(f"Address: {result.get('address')}")
        print(f"Rating: {result.get('rating')}")
        print(f"Google Place ID: {result.get('google_place_id')}")
    else:
        print("결과를 가져오지 못했습니다. (None 반환)")

if __name__ == "__main__":
    test_google_places()
