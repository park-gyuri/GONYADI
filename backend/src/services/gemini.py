
from collections import defaultdict
from src.schemas.recommend_schema import PlaceResult, CuratedPlaceResult, PlaceCandidate, DaySchedule
from google import genai
from google.genai import types
import os

def get_gemini_places(prompt: str) -> list[DaySchedule]:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    system_instruction = """너는 관광 데이터베이스에 기반한 전문 여행 가이드야.
반드시 아래의 '장소 추천 규칙'을 엄격히 준수해.

[장소 추천 규칙]
1. 공식 명칭 사용: 네이버 지도나 구글 지도에서 검색했을 때 바로 나오는 공식 명칭만 사용해.
2. 구체적 명소 선정: 뭉뚱그린 표현 대신 구체적인 장소명을 추천해.
3. 각 장소마다 name, lat, lng, reason, duration, category 를 반드시 포함해.
4. 반드시 프롬프트에 명시된 일수(N일)만큼 day 필드를 나눠서 반환해. (1일차 → day:1, 2일차 → day:2 ...)
5. 각 일차(day)에 6~7개의 장소를 배정하고, 하루 동선이 자연스럽도록 인접한 장소들을 묶어서 배치해.
6. 만약 프롬프트에 [현재 일정]이 제공되었다면, 사용자의 [상세 요청]을 반영하되 언급되지 않은 기존 장소는 순서와 내용을 최대한 그대로 유지해.

[현실적인 하루 일정 구성 규칙]
7. 하루 구조: 아침 식사 → 오전 활동(테마/관광) → 점심 식사 → 오후 활동 2~3개 → 저녁 식사 → 저녁 활동(선택)
8. 동일 유형 장소(스파·온천 등)는 하루 1개로 제한. 테마 장소 최대 2~3개.
9. category 필드: 식사 장소는 '맛집', 카페는 '카페', 관광지는 '관광명소'로 명확히 구분해."""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=list[DaySchedule],
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        result: list[DaySchedule] = response.parsed or []
        if not result:
            print("get_gemini_places: 빈 결과 반환됨")
            return []
        total = sum(len(d.places) for d in result)
        print(f"일차별 추천 완료: {len(result)}일 / 총 {total}개 장소")
        for d in result:
            print(f"  {d.day}일차: {[p.name for p in d.places]}")
        return result
    except Exception as e:
        print(f"get_gemini_places 에러: {e}")
        return []


# ── [RAG] Step 3: LLM Curation — 후보 풀 안에서만 선택 ───────────────────────
_CONDITION_RULES: dict[str, str] = {
    "휠체어": (
        "⛔ 휠체어 접근 불가 장소 절대 선택 금지: 계단만 있는 건물, 엘리베이터 없는 다층 시설, "
        "경사로 미설치 장소는 후보에 있어도 건너뛰어야 해. "
        "턱 없는 출입구·엘리베이터·장애인 주차공간이 있을 법한 장소(대형 시설, 공원, 관광지)를 우선 선택해."
    ),
    "반려동물 동반": (
        "⛔ 반려동물 입장 불가 장소 절대 선택 금지: 실내 전용 박물관·미술관·백화점처럼 "
        "반려동물이 들어가기 어려운 장소는 후보에 있어도 건너뛰어야 해. "
        "야외 공원, 펫프리 카페, 펫 동반 식당, 야외 관광지를 우선 선택해."
    ),
    "어린이 동반": (
        "⛔ 성인 전용·어린이 위험 장소 절대 선택 금지: 바·클럽·심야 영업 위주 장소·위험 액티비티는 "
        "후보에 있어도 건너뛰어야 해. "
        "놀이시설·체험관·공원·수족관·동물원·키즈카페·가족 친화 레스토랑을 우선 선택해. "
        "이동 동선도 유모차 접근이 가능하도록 가까운 장소들을 묶어 배치해."
    ),
}


def _build_condition_instruction(conditions: list[str]) -> str:
    rules = [_CONDITION_RULES[c] for c in conditions if c in _CONDITION_RULES]
    if not rules:
        return ""
    lines = "\n".join(f"- {r}" for r in rules)
    return f"\n\n[필수 여행 조건 — 절대 위반 금지]\n{lines}"


def get_gemini_curated_places(
    prompt: str,
    candidates: list[PlaceCandidate],
    conditions: list[str] | None = None,
) -> list[DaySchedule]:
    """
    RAG 파이프라인 전용 Gemini 호출.

    - LLM은 CuratedPlaceResult(place_pk, day, order, reason, duration)만 반환한다.
    - 반환된 place_pk를 candidates 풀과 교차검증해 허위 pk를 자동 제거한다.
    - 검증된 결과를 day별로 그룹화해 list[DaySchedule]로 반환한다.
    """
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    condition_block = _build_condition_instruction(conditions or [])

    system_instruction = f"""너는 여행 일정 큐레이터야.
반드시 아래 규칙을 준수해:

[절대 규칙]
1. 프롬프트의 [검증된 장소 후보] 리스트에 있는 place_pk만 사용해.
2. 리스트에 없는 place_pk를 절대 출력하지 마.
3. 새로운 장소 이름이나 좌표를 만들어내지 마.
4. place_pk, day, order, reason, duration 필드만 반환해.
5. day는 여행 일차 번호(1부터 시작), order는 해당 일차 내 방문 순서(1부터 시작)야.

[현실적인 일정 구성 규칙]
6. 하루 구조: 아침 식사 → 오전 활동(테마/관광) → 점심 식사 → 오후 활동 2~3개 → 저녁 식사 → 저녁 활동(선택)
7. 하루 6~7개 장소 중 식사 장소(맛집·식당)는 최대 3개(아침/점심/저녁 각 1개), 카페는 최대 1개로 제한해.
8. 나머지 2~3개는 반드시 관광명소·오락·레저·체험·힐링 등 비식사·비카페 장소로 채워.
9. 같은 카테고리(식당→식당, 카페→카페)를 연속 배치하지 마.{condition_block}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=list[CuratedPlaceResult],
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        curated: list[CuratedPlaceResult] = response.parsed or []
    except Exception as e:
        print(f"[RAG Gemini] 에러: {e}")
        return []

    # 후보 풀 인덱스 (place_pk → PlaceCandidate)
    candidate_map: dict[int, PlaceCandidate] = {c.place_pk: c for c in candidates}
    valid_pks = set(candidate_map.keys())
    seen_pks: set[int] = set()

    # day별로 그룹화 (day → [(order, PlaceResult)])
    day_groups: dict[int, list[tuple[int, PlaceResult]]] = defaultdict(list)

    for item in curated:
        if item.place_pk not in valid_pks:
            print(f"[RAG 검증] 허위 place_pk={item.place_pk} 제거됨 (후보에 없음)")
            continue
        if item.place_pk in seen_pks:
            print(f"[RAG 검증] 중복 place_pk={item.place_pk} 제거됨")
            continue
        seen_pks.add(item.place_pk)

        cand = candidate_map[item.place_pk]
        day_groups[item.day].append((
            item.order,
            PlaceResult(
                name=cand.name,
                lat=cand.lat,
                lng=cand.lng,
                reason=item.reason,
                duration=item.duration,
                category=cand.category,
            )
        ))

    schedule: list[DaySchedule] = []
    for day in sorted(day_groups.keys()):
        places = [p for _, p in sorted(day_groups[day], key=lambda x: x[0])]
        schedule.append(DaySchedule(day=day, places=places))

    total = sum(len(d.places) for d in schedule)
    print(
        f"[RAG Gemini] 큐레이션 완료: "
        f"LLM 반환 {len(curated)}개 → 검증 후 {total}개 ({len(schedule)}일)"
    )
    for d in schedule:
        print(f"  {d.day}일차: {[p.name for p in d.places]}")
    return schedule


# ── [RAG] Step 3-2: AI 검토 및 보정 ─────────────────────────────────────────
def critique_and_revise_itinerary(
    schedule: list[DaySchedule],
    candidates: list[PlaceCandidate],
    total_days: int,
    conditions: list[str] | None = None,
) -> list[DaySchedule]:
    """
    1차 큐레이션 결과를 Gemini가 스스로 검토하고 문제가 있으면 수정한다.
    day 경계를 유지한 채 문제 있는 장소만 교체하거나 순서를 조정한다.
    """
    if not schedule or not candidates:
        return schedule

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    current_itinerary = "\n".join(
        f"day={d.day} order={i+1} place_pk={next((c.place_pk for c in candidates if c.name == p.name), '?')} "
        f"[{p.category}] {p.name} ({p.duration}분)"
        for d in schedule
        for i, p in enumerate(d.places)
    )
    candidate_lines = "\n".join(
        f"  {c.place_pk}|{c.name}|{c.category}|{round(c.distance_km, 2)}km"
        for c in candidates
    )
    valid_pks_str = ", ".join(str(c.place_pk) for c in candidates)

    condition_block = _build_condition_instruction(conditions or [])
    condition_criteria = ""
    if conditions:
        cond_str = "·".join(conditions)
        condition_criteria = f"\n5. [{cond_str}] 조건에 맞지 않는 장소가 포함되어 있는가? 있다면 조건에 부합하는 장소로 교체하십시오."

    prompt = f"""
당신은 여행 일정 품질 검토 전문가입니다.
아래 [{total_days}일 여행 일정]을 검토하고, 문제가 있으면 [검증된 장소 후보] 내에서 수정하십시오.

[현재 일정]
{current_itinerary}

[검증된 장소 후보] (place_pk|이름|카테고리|거리)
{candidate_lines}

[검토 기준 — 하나라도 해당하면 수정 필요]
1. 동일하거나 유사한 유형의 장소가 연속으로 배치되어 있는가? (식당→식당, 카페→카페 등)
2. 하루 일정에서 식사 장소(맛집·식당)가 4개 이상이거나, 카페가 2개 이상인가?
3. 하루 일정에서 식사 장소(맛집·식당)가 3개 미만인가? (아침·점심·저녁 각 1개 필수)
4. 관광명소·오락·레저·체험·힐링 등 비식사·비카페 장소가 하루 2개 미만인가?
5. 하루 일정이 아래 구조를 따르지 않는가?
   아침 식사 → 오전 활동 → 점심 식사 → 오후 활동(2~3개) → 저녁 식사 → 저녁 활동(선택){condition_criteria}

[수정 규칙]
- 유효한 place_pk: [{valid_pks_str}]
- 반드시 위 후보에 있는 place_pk만 사용하십시오.
- 문제 없으면 현재 일정의 place_pk를 day·order 그대로 반환하십시오.
- 식사 장소 초과 시: 초과된 식사·카페를 관광명소·오락·레저·힐링 장소로 교체하십시오.
- 식사 장소 부족 시: 후보 중 맛집·식당 카테고리 장소를 추가하고, 비식사 장소를 하나 제거해 교체하십시오.
- day 경계는 바꾸지 마십시오.
- place_pk, day, order, reason, duration 필드만 반환하십시오.
""".strip()

    system_instruction = f"""너는 여행 일정 품질 검토자야.
주어진 일정의 문제점을 판단하고, [검증된 장소 후보] 안에서만 수정해.
절대로 후보에 없는 place_pk를 만들어내지 마.
day 경계를 임의로 변경하지 마.{condition_block}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=list[CuratedPlaceResult],
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        revised: list[CuratedPlaceResult] = response.parsed or []
    except Exception as e:
        print(f"[AI 검토] Gemini 오류 → 원본 유지: {e}")
        return schedule

    candidate_map: dict[int, PlaceCandidate] = {c.place_pk: c for c in candidates}
    valid_pks = set(candidate_map.keys())
    seen_pks: set[int] = set()
    # (day, order) → PlaceResult : 같은 위치에 원본·대체 장소가 둘 다 오면 마지막 것만 유지
    slot_map: dict[tuple[int, int], PlaceResult] = {}

    for item in revised:
        if item.place_pk not in valid_pks or item.place_pk in seen_pks:
            print(f"[AI 검토] 허위/중복 place_pk={item.place_pk} 제거")
            continue
        seen_pks.add(item.place_pk)
        cand = candidate_map[item.place_pk]
        slot_map[(item.day, item.order)] = PlaceResult(
            name=cand.name,
            lat=cand.lat,
            lng=cand.lng,
            reason=item.reason,
            duration=item.duration,
            category=cand.category,
        )

    day_groups: dict[int, list[tuple[int, PlaceResult]]] = defaultdict(list)
    for (day, order), place in slot_map.items():
        day_groups[day].append((order, place))

    if not day_groups:
        print("[AI 검토] 수정 결과 없음 → 원본 유지")
        return schedule

    revised_schedule: list[DaySchedule] = []
    for day in sorted(day_groups.keys()):
        places = [p for _, p in sorted(day_groups[day], key=lambda x: x[0])]
        revised_schedule.append(DaySchedule(day=day, places=places))

    original_names = [p.name for d in schedule for p in d.places]
    revised_names  = [p.name for d in revised_schedule for p in d.places]
    if original_names != revised_names:
        print(f"[AI 검토] 일정 보정 완료: {original_names} → {revised_names}")
    else:
        print("[AI 검토] 문제 없음 — 원본 유지")

    return revised_schedule


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