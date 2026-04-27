from src.schemas.recommend_schema import (
    RecommendRequest,
    ThemeCategories,
    TransportCategories,
    ConditionCategories,
)
THEME_EXPLANATION = {
    ThemeCategories.HEALING:  "스파·온천·힐링 카페",
    ThemeCategories.FOOD:     "현지 맛집·로컬 식당",
    ThemeCategories.PHOTO:    "포토존·인생샷 명소",
    ThemeCategories.EXHIBIT:  "미술관·갤러리·전시",
    ThemeCategories.ACTIVITY: "공방·이색 체험",
    ThemeCategories.CAFE:     "분위기 카페·루프탑",
    ThemeCategories.LEISURE:  "놀이공원·스포츠·액티비티",
    ThemeCategories.HISTORY:  "유적지·고궁·박물관",
    ThemeCategories.CULTURE:  "공연·전통문화·축제",
    ThemeCategories.SHOPPING: "쇼핑몰·전통시장·면세점",
    ThemeCategories.FESTIVAL: "지역 축제·이벤트·장터",
    ThemeCategories.NATURE:   "산·바다·호수·자연경관",
}

TRANSPORT_EXPLANATION = {
    TransportCategories.WALK:    "도보권 위주",
    TransportCategories.CAR:     "주차 가능·광역",
    TransportCategories.BIKE:    "자전거도로 우선",
    TransportCategories.TRANSIT: "역세권 우선",
}

CONDITION_EXPLANATION = {
    ConditionCategories.WHEELCHAIR: "휠체어 접근 가능한 장소만 추천 (턱 없음, 엘리베이터 필수)",
    ConditionCategories.PET:        "반려동물 입장 가능한 장소만 추천",
    ConditionCategories.CHILD:      "어린이 동반 가능한 장소 추천 (유모차 접근, 안전 우선)",
}




def build_hybrid_prompt(req: RecommendRequest) -> str:

    # 일정 - 날짜 있으면 날짜 포함, 없으면 기간만
    if req.start_date and req.end_date:
        refined_schedule = f"{req.start_date} ~ {req.end_date} ({req.nights}박 {req.days}일)"
    else:
        refined_schedule = f"{req.nights}박 {req.days}일 (날짜 미정)"

    # 예산 - None이면 "예산 무관", 숫자면 원 단위로 표시
    refined_budget = f"{req.budget_per_person}원" if req.budget_per_person is not None else "예산 무관"

    # 선택한 이동수단들을 꺼내서 배경 설명 붙여 여러 줄 문자열로 만들기
    transport_details = []
    for t in req.transports:
        transport_details.append(f"  - {t.value}: {TRANSPORT_EXPLANATION[t]}")
    
    refined_transport = "\n".join(transport_details)

    # 🚨 이동수단에 따른 장소 간 거리 제한 지시 추가 🚨
    if TransportCategories.WALK in req.transports and len(req.transports) == 1:
        refined_transport += "\n\n(🚨동선 주의: 사용자가 오직 '도보'만 선택했습니다. 모든 장소 간 이동 거리가 최대 도보 30분(약 2km) 이내가 되도록 아주 좁은 지역에 밀집시켜 짜주세요. 100분이 넘어가는 이동은 절대 불가합니다.)"
    elif TransportCategories.WALK in req.transports:
        refined_transport += "\n\n(🚨동선 주의: 사용자가 여러 이동수단 중 '도보'도 선택했습니다. 가급적 도보 30분 이내로 갈 수 있는 장소들을 묶어서 추천하고, 불가피하게 거리가 멀 때는 자동차/대중교통을 이용할 수 있는 동선으로 짜주세요.)"

    # 선택한 테마들을 꺼내서 배경 설명 붙여 여러 줄 문자열로 만들기
    refined_theme = "\n".join(
        f"  - {t.value}: {THEME_EXPLANATION[t]}"
        for t in req.themes
    )

    # 여행 조건이 있을 때만 섹션 생성, 없으면 빈 문자열 → 프롬프트에서 사라짐
    refined_condition = "\n".join(
        f"  - {c.value}: {CONDITION_EXPLANATION[c]}"
        for c in req.conditions
    )
    refined_condition = f"\n[필수 조건]\n{refined_condition}" if refined_condition else ""

    # 상세 요청이 있을 때만 섹션 생성, 없으면 빈 문자열 → 프롬프트에서 사라짐
    refined_request = (
        f'\n[상세 요청]\n"{req.user_message}"'
        if req.user_message.strip() else ""
    )

    # 기존 일정이 있을 때 (재추천 모드)
    refined_history = ""
    if req.original_places:
        history_lines = [f"{i+1}. {p.name} ({p.category}) - {p.reason}" for i, p in enumerate(req.original_places)]
        refined_history = (
            "\n[현재 일정]\n" + 
            "\n".join(history_lines) + 
            "\n\n(🚨재추천 규칙🚨:\n"
            "1. 위 [현재 일정]은 사용자가 이미 선택한 장소들입니다.\n"
            "2. 사용자가 [상세 요청]을 통해 수정을 요구한 사항(예: 특정 장소 제외, 새로운 테마 추가 등)을 정확히 파악하세요.\n"
            "3. 요구사항에 따라 일부 장소를 삭제하거나 새로운 장소로 교체/추가하되, **수정 대상이 아닌 기존 장소들은 출력 JSON 배열에 그대로(이름과 내용 동일하게) 포함**시켜야 합니다.\n"
            "4. 전체 장소의 개수나 일정이 적절히 유지되도록 하세요.)\n"
        )

    return f"""
당신은 여행 일정 전문 큐레이터입니다.

[여행 기본 정보]
- 지역: {req.region}
- 일정: {refined_schedule}
- 인원: {req.number_of_people}명
- 1인 예산: {refined_budget}

[이동 수단]
{refined_transport}

[여행 테마]
{refined_theme}
{refined_condition}
{refined_history}
{refined_request}

위 조건을 모두 반영하여 {req.days}일 일정에 맞는 장소를 추천해 주세요.
필수 조건이 있다면 반드시 지키고, 상세 요청을 최우선으로 반영해 주세요.
""".strip()