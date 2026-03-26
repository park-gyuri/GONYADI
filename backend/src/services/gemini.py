from src.schemas.recommend_schema import PlaceResult
from google import genai
from google.genai import types
import os

def get_gemini_places(prompt: str) -> list[PlaceResult]:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    system_instruction = """너는 한국 관광 데이터베이스에 기반한 전문 여행 가이드야.
반드시 아래의 '장소 추천 규칙'을 엄격히 준수해.

[장소 추천 규칙]
1. 공식 명칭 사용: 네이버 지도나 구글 지도에서 검색했을 때 바로 나오는 공식 명칭만 사용해.
2. 구체적 명소 선정: 뭉뚱그린 표현 대신 구체적인 장소명을 추천해.
3. 각 장소마다 name, lat, lng, reason, duration, category 를 반드시 포함해."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=list[PlaceResult],
        ),
    )

    try:
        result = response.parsed
        if not result:
            print("get_gemini_places: 빈 결과 반환됨")
            return []
        print(f"추천 장소 {len(result)}개 반환됨: {[p.name for p in result]}")
        return result
    except Exception as e:
        print(f"get_gemini_places 파싱 에러: {e}")
        print(f"원본 응답: {response.text}")
        return []


'''
import os
import json
import requests
import re
from src.schemas.recommend_schema import PlaceResult

def get_gemini_places(prompt: str) -> list[PlaceResult]:
    api_key = os.getenv("GEMINI_API_KEY") 
    url = "https://code.cu.ac.kr/llm/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # 시스템 메시지를 아주 엄격하게 수정합니다.
    payload = {
        "model": "Qwen3.0-70B-INT8",
        "messages": [
            {
                "role": "system", 
                "content": """너는 한국 관광 데이터베이스에 기반한 전문 여행 가이드야.
반드시 아래의 '장소 추천 규칙'을 엄격히 준수하여 JSON으로만 응답해.

[장소 추천 규칙]
1. 공식 명칭 사용: '네이버 지도'나 '구글 지도'에서 검색했을 때 바로 나오는 공식 명칭만 사용해. (예: '강릉 힐링 스파' (X) -> '강릉 솔향 온천' (O))
2. 구체적 명소 선정: 뭉뚱그린 표현(예: '강릉 카페') 대신 구체적인 장소명(예: '테라로사 커피공장 강릉본점')을 추천해.
3. 데이터 형식: 반드시 아래 필드를 포함하는 JSON 배열([]) 형식만 출력해. 설명이나 마크다운(```)은 절대 금지야.
   - name: 장소의 정확한 공식 명칭
   - lat: 해당 장소의 위도 (실수형)
   - lng: 해당 장소의 경도 (실수형)
   - reason: 해당 장소를 추천하는 구체적인 이유 (문자열)
   - duration: 예상 체류 시간 (분 단위 정수)
   - category: 장소 분류 (예: 음식점, 카페, 관광지, 숙소)"""
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "stream": False
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        content = response.json()['choices'][0]['message']['content'].strip()
        
        # 마크다운 제거 로직
        content = re.sub(r'^```[a-z]*\n|^```|```$', '', content, flags=re.MULTILINE).strip()
        
        # 디버깅용 출력 (터미널에서 AI가 뭐라고 했는지 확인 가능)
        print(f"--- AI 응답 원본 ---\n{content}")

        raw_data = json.loads(content)
        
        # 데이터가 리스트가 아니라면 리스트로 감싸줌 (방어 코드)
        if isinstance(raw_data, dict):
            raw_data = [raw_data]

        return [PlaceResult(**item) for item in raw_data]

    except Exception as e:
        print(f"DCU LLM 파싱 에러: {e}")
        return []
'''
    