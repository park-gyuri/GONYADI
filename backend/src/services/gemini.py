
from src.schemas.recommend_schema import PlaceResult, CuratedPlaceResult, PlaceCandidate
from google import genai
from google.genai import types
import os

def get_gemini_places(prompt: str) -> list[PlaceResult]:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    system_instruction = """너는 관광 데이터베이스에 기반한 전문 여행 가이드야.
반드시 아래의 '장소 추천 규칙'을 엄격히 준수해.

[장소 추천 규칙]
1. 공식 명칭 사용: 네이버 지도나 구글 지도에서 검색했을 때 바로 나오는 공식 명칭만 사용해.
2. 구체적 명소 선정: 뭉뚱그린 표현 대신 구체적인 장소명을 추천해.
3. 각 장소마다 name, lat, lng, reason, duration, category 를 반드시 포함해.
4. 만약 프롬프트에 [현재 일정]이 제공되었다면, 사용자의 [상세 요청]을 반영하되 언급되지 않은 기존 장소는 순서와 내용을 최대한 그대로 유지해."""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=list[PlaceResult],
            ),
        )
        result = response.parsed
        if not result:
            print("get_gemini_places: 빈 결과 반환됨")
            return []
        print(f"추천 장소 {len(result)}개 반환됨: {[p.name for p in result]}")
        return result
    except Exception as e:
        print(f"get_gemini_places 에러: {e}")
        return []


# ── [RAG] Step 3: LLM Curation — 후보 풀 안에서만 선택 ───────────────────────
def get_gemini_curated_places(
    prompt: str,
    candidates: list[PlaceCandidate],
) -> list[PlaceResult]:
    """
    RAG 파이프라인 전용 Gemini 호출.

    - LLM은 CuratedPlaceResult(place_pk, order, reason, duration)만 반환한다.
    - 반환된 place_pk를 candidates 풀과 교차검증해 허위 pk를 자동 제거한다.
    - 검증된 pk로 candidates에서 실제 좌표·이름을 조합해 PlaceResult 리스트로 반환한다.
    """
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    system_instruction = """너는 여행 일정 큐레이터야.
반드시 아래 규칙을 준수해:

[절대 규칙]
1. 프롬프트의 [검증된 장소 후보] 리스트에 있는 place_pk만 사용해.
2. 리스트에 없는 place_pk를 절대 출력하지 마.
3. 새로운 장소 이름이나 좌표를 만들어내지 마.
4. place_pk, order, reason, duration 필드만 반환해.
5. order는 1부터 시작하는 방문 순서야."""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=list[CuratedPlaceResult],
            ),
        )
        curated: list[CuratedPlaceResult] = response.parsed or []
    except Exception as e:
        print(f"[RAG Gemini] 에러: {e}")
        return []

    # 후보 풀 인덱스 (place_pk → PlaceCandidate)
    candidate_map: dict[int, PlaceCandidate] = {c.place_pk: c for c in candidates}

    # 교차검증: LLM이 반환한 place_pk가 실제 후보에 있는지 확인
    valid_pks = set(candidate_map.keys())
    results: list[PlaceResult] = []
    seen_pks: set[int] = set()

    for item in sorted(curated, key=lambda x: x.order):
        if item.place_pk not in valid_pks:
            print(f"[RAG 검증] 허위 place_pk={item.place_pk} 제거됨 (후보에 없음)")
            continue
        if item.place_pk in seen_pks:
            print(f"[RAG 검증] 중복 place_pk={item.place_pk} 제거됨")
            continue
        seen_pks.add(item.place_pk)

        cand = candidate_map[item.place_pk]
        results.append(
            PlaceResult(
                name=cand.name,
                lat=cand.lat,
                lng=cand.lng,
                reason=item.reason,
                duration=item.duration,
                category=cand.category,
            )
        )

    print(
        f"[RAG Gemini] 큐레이션 완료: "
        f"LLM 반환 {len(curated)}개 → 검증 후 {len(results)}개"
    )
    return results

'''
import os
import re
import httpx
import asyncio
from src.schemas.recommend_schema import PlaceResult

async def get_gemini_places(prompt: str) -> list[PlaceResult]:
    api_key = os.getenv("GEMINI_API_KEY") 
    url = "https://code.cu.ac.kr/llm/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    system_instruction = (
        "너는 여행 코스 생성기야. 서론과 분석은 100자 이내로 아주 짧게 작성해.\n"
        "그다음 반드시 '---DATA---'라고 한 줄을 출력하고, 즉시 아래 형식으로 데이터를 나열해.\n"
        "형식: 장소명|위도|경도|추천이유|예상소요시간|카테고리\n"
        "예시: 해운대 해수욕장|35.158|129.160|바다를 보며 힐링|120|관광명소"
    )

    payload = {
        "model": "Qwen/Qwen3.5-9B", 
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 1500,
        "top_p": 0.7,
        "stop": None
    }

    async with httpx.AsyncClient() as client:
        try:
            print(">>> [LLM] AI에게 요청을 보냈습니다. 잠시만 기다려 주세요...")
            response = await client.post(
                url, headers=headers, json=payload,
                timeout=httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=5.0)
            )
            
            print(f"<<< [LLM] 응답 도착! (상태 코드: {response.status_code})")

            if response.status_code != 200:
                print(f"API 에러: {response.status_code} - {response.text}")
                return []

            raw_json = response.json()
            message = raw_json['choices'][0]['message']
            
            # [수정 포인트] content와 reasoning 중 데이터가 있는 곳을 안전하게 가져옴
            content = message.get('content') or ""
            reasoning = message.get('reasoning') or ""
            
            # 두 필드 중 하나라도 데이터가 있다면 합쳐서 검사
            full_text = (content + "\n" + reasoning).strip()

            if not full_text:
                print("[DCU LLM] 에러: AI가 아무런 텍스트도 뱉지 않았습니다.")
                return []

            raw_data = []
            
            # ---DATA--- 구분자가 있다면 그 이후만, 없다면 전체에서 파이프(|) 라인 추출
            target_text = full_text.split("---DATA---")[-1] if "---DATA---" in full_text else full_text

            lines = target_text.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line.count('|') >= 5:
                    parts = [p.strip() for p in line.split('|')]
                    try:
                        # 필수 데이터 추출 및 정제
                        name = parts[0]
                        lat = float(parts[1])
                        lng = float(parts[2])
                        reason = parts[3]
                        
                        # 예상소요시간 숫자 추출 (실패 시 기본값 60)
                        duration_match = re.search(r'\d+', parts[4])
                        duration = int(duration_match.group()) if duration_match else 60
                        
                        category = parts[5]

                        raw_data.append({
                            "name": name,
                            "lat": lat,
                            "lng": lng,
                            "reason": reason,
                            "duration": duration,
                            "category": category
                        })
                    except (ValueError, IndexError):
                        continue

            print(f"--- 파싱 완료: {len(raw_data)}개의 장소 발견 ---")
            if len(raw_data) > 0:
                print(f"첫 번째 장소 예시: {raw_data[0]['name']}")
                
            return [PlaceResult(**item) for item in raw_data]

        except Exception as e:
            print(f"처리 중 예상치 못한 에러 발생: {e}")
            return []

'''