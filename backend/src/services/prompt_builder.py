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
    refined_transport = "\n".join(
        f"  - {t.value}: {TRANSPORT_EXPLANATION[t]}"
        for t in req.transports
    )
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
{refined_request}

위 조건을 모두 반영하여 {req.days}일 일정에 맞는 장소를 추천해 주세요.
필수 조건이 있다면 반드시 지키고, 상세 요청을 최우선으로 반영해 주세요.
""".strip()