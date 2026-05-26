from src.schemas.recommend_schema import (
    RecommendRequest,
    ThemeCategories,
    TransportCategories,
    ConditionCategories,
    PlaceCandidate,
)
THEME_EXPLANATION = {
    ThemeCategories.HEALING:  "스파·온천·찜질방·마사지샵·명상센터·힐링 숲길·수목원·치유농장·한옥 게스트하우스·조용한 정원",
    ThemeCategories.FOOD:     "현지 맛집·로컬 식당·향토 음식점·유명 분식·야시장·전통 시장 먹거리·베이커리·브런치 카페·디저트 전문점",
    ThemeCategories.PHOTO:    "포토존·인생샷 명소·벽화마을·야경 뷰포인트·전망대·꽃밭·감성 골목·이색 건축물·루프탑 뷰·강변·해안 절경",
    ThemeCategories.EXHIBIT:  "미술관·갤러리·현대미술관·사진전·조각공원·아트센터·복합문화공간·미디어아트·체험형 전시관",
    ThemeCategories.ACTIVITY: "공방·도예·그림·향수·가죽·쿠킹 클래스·VR체험·방탈출·클라이밍·서핑·카약·패러글라이딩·짚라인·낚시·승마",
    ThemeCategories.CAFE:     "분위기 카페·루프탑 카페·북카페·애견카페·식물카페·한옥카페·뷰 카페·대형 테마카페·공방카페·숨은 골목 카페",
    ThemeCategories.ARCADE:   "오락실·PC방·노래방·볼링·당구·스크린골프·방탈출·VR체험·인형뽑기",
    ThemeCategories.LEISURE:  "놀이공원·워터파크·볼링·스포츠센터·실내 스포츠·스케이트장·번지점프·서바이벌·레이싱·양궁·패러글라이딩·서핑·카약·짚라인·클라이밍",
    ThemeCategories.HISTORY:  "유적지·고궁·성곽·박물관·역사관·독립운동 기념관·근현대 문화유산·전통 마을·종묘·사찰·고택",
    ThemeCategories.CULTURE:  "공연·뮤지컬·연극·영화관·멀티플렉스·전통문화관·국악·민속촌·문화재 탐방·지역 문화센터·서점·독립영화관",
    ThemeCategories.SHOPPING: "쇼핑몰·아울렛·전통시장·면세점·로컬 편집숍·빈티지샵·공예품 거리·기념품 거리·플리마켓",
    ThemeCategories.FESTIVAL: "지역 축제·이벤트·장터·야시장·플리마켓·계절 축제·음식 축제·불꽃놀이·문화 행사·거리 공연",
    ThemeCategories.NATURE:   "산·바다·호수·강·계곡·폭포·해변·섬·국립공원·생태공원·수목원·둘레길·트레킹 코스·캠핑장·일출·일몰 명소",
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
반드시 1일차부터 {req.days}일차까지 day 필드로 구분하여 각 일차에 6~7개 장소를 배정하세요.
필수 조건이 있다면 반드시 지키고, 상세 요청을 최우선으로 반영해 주세요.
""".strip()


# ── [RAG] Step 3: LLM Curation 전용 프롬프트 빌더 ─────────────────────────────
def build_rag_prompt(req: RecommendRequest, candidates: list[PlaceCandidate]) -> str:
    """
    DB에서 검증된 후보 장소 리스트(PlaceCandidate)를 기반으로
    Gemini가 '후보 리스트 안에서만' 장소를 선택하도록 강제하는 프롬프트를 생성한다.

    LLM은:
    - 새로운 장소를 만들어내지 않는다 (Hallucination 방지)
    - place_pk, order, reason, duration만 반환한다
    - 후보에 없는 place_pk를 출력하면 시스템에서 필터링된다
    """
    # 일정
    if req.start_date and req.end_date:
        refined_schedule = f"{req.start_date} ~ {req.end_date} ({req.nights}박 {req.days}일)"
    else:
        refined_schedule = f"{req.nights}박 {req.days}일 (날짜 미정)"

    # 예산
    refined_budget = f"{req.budget_per_person}원" if req.budget_per_person is not None else "예산 무관"

    # 이동수단
    transport_details = "\n".join(
        f"  - {t.value}: {TRANSPORT_EXPLANATION[t]}" for t in req.transports
    )

    # 테마
    refined_theme = "\n".join(
        f"  - {t.value}: {THEME_EXPLANATION[t]}" for t in req.themes
    )

    # 조건
    refined_condition = "\n".join(
        f"  - {c.value}: {CONDITION_EXPLANATION[c]}" for c in req.conditions
    )
    refined_condition = f"\n[필수 조건]\n{refined_condition}" if refined_condition else ""

    # 상세 요청
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

    # 후보 리스트 문자열 (place_pk|name|거리km|카테고리|[태그])
    condition_values = [c.value for c in req.conditions]
    theme_values = [t.value for t in req.themes]

    def _fmt_festival_date(d: str) -> str:
        """YYYYMMDD → MM/DD"""
        return f"{d[4:6]}/{d[6:8]}" if d and len(d) == 8 else d

    def _cand_tag(p: PlaceCandidate) -> str:
        tags = []
        if p.is_accessible is True:
            tags.append("무장애인증")
        if p.is_pet_friendly is True:
            tags.append("반려동물가능")
        if p.festival_start_date:
            s = _fmt_festival_date(p.festival_start_date)
            e = _fmt_festival_date(p.festival_end_date or p.festival_start_date)
            tags.append(f"축제:{s}~{e}")
        return f" [{','.join(tags)}]" if tags else ""

    candidate_lines = "\n".join(
        f"  {p.place_pk}|{p.name}|{round(p.distance_km, 2)}km|{p.category}{_cand_tag(p)}"
        for p in candidates
    )
    valid_pks = ", ".join(str(p.place_pk) for p in candidates)

    # 조건별 우선순위 규칙 (후보 태그 기반)
    condition_priority_rule = ""
    if "휠체어" in condition_values:
        condition_priority_rule = "\n8. [무장애인증] 태그가 있는 장소를 최우선으로 선택하십시오. 태그가 없는 장소는 [무장애인증] 장소로 하루 일정을 채울 수 없을 때만 보충용으로 사용하십시오."
    elif "반려동물 동반" in condition_values:
        condition_priority_rule = "\n8. [반려동물가능] 태그가 있는 장소를 최우선으로 선택하십시오. 태그가 없는 장소는 [반려동물가능] 장소만으로 일정을 채울 수 없을 때만 보충용으로 사용하십시오."

    # 축제 일차 배치 규칙: 날짜가 확정된 경우 day→date 매핑 제공
    festival_date_rule = ""
    if "축제" in theme_values:
        if req.start_date and req.days:
            from datetime import timedelta
            day_map_lines = []
            for i in range(req.days):
                day_date = req.start_date + timedelta(days=i)
                day_map_lines.append(f"    {i+1}일차 = {day_date.strftime('%Y-%m-%d')}")
            festival_date_rule = (
                "\n9. [축제 일정 배치 규칙]\n"
                "   일차별 실제 날짜:\n" + "\n".join(day_map_lines) + "\n"
                "   [축제:MM/DD~MM/DD] 태그가 있는 장소는 반드시 해당 날짜 범위 내 일차에 배치하십시오.\n"
                "   예) [축제:06/01~06/03] → 1일차(06/01), 2일차(06/02), 3일차(06/03) 중 하나에만 배치 가능."
            )
        else:
            festival_date_rule = (
                "\n9. [축제 일정 배치 규칙]\n"
                "   여행 날짜가 지정되지 않았습니다. [축제:MM/DD~MM/DD] 태그가 있는 장소는\n"
                "   실제 축제 기간에 방문할 수 있도록 일정 초반부 또는 중반부에 배치하고,\n"
                "   축제 정보를 reason 필드에 명시하십시오."
            )

    return f"""
당신은 여행 일정 전문 큐레이터입니다.
아래 [검증된 장소 후보] 리스트는 실제 지도에 존재하는 장소들입니다.

[중요 규칙 — 반드시 준수]
1. 반드시 아래 [검증된 장소 후보] 리스트에 있는 장소만 선택하십시오.
2. 리스트에 없는 새로운 장소를 절대 만들거나 추가하지 마십시오.
3. 유효한 place_pk는 다음과 같습니다: [{valid_pks}]
4. place_pk, day, order, reason, duration 필드만 반환하십시오.
5. day는 여행 일차(1부터 {req.days}일차), order는 해당 일차 내 방문 순서(1부터 시작)입니다.
6. 전체 {req.days}일 일정에 맞게 하루 6~7개 장소를 선택하십시오.
7. 사용자가 [상세 요청]에서 언급한 장소명은 비공식·구어체 명칭일 수 있습니다 (예: '남산타워' → 'N서울타워', '롯데타워' → '롯데월드타워'). [검증된 장소 후보] 리스트에서 의미상 동일하거나 가장 가까운 장소를 찾아 해당 place_pk를 선택하십시오.{condition_priority_rule}{festival_date_rule}

[검증된 장소 후보] (형식: place_pk|장소명|중심거리|카테고리)
{candidate_lines}

[여행 기본 정보]
- 지역: {req.region}
- 일정: {refined_schedule}
- 인원: {req.number_of_people}명
- 1인 예산: {refined_budget}

[이동 수단]
{transport_details}

[여행 테마]
{refined_theme}
{refined_condition}
{refined_history}
{refined_request}

위 후보 중에서 사용자의 여행 조건에 최적인 장소들을 선택하고,
동선이 자연스럽도록 방문 순서(order)와 추천 사유(reason), 예상 소요 시간(duration, 분)을 반환하십시오.

[일정 구성 조건]
- 하루 구조: 아침 식사 → 오전 활동 → 점심 식사 → 오후 활동(2~3개) → 저녁 식사 → 저녁 활동(선택)
- 식사 장소(맛집·식당)는 하루 최대 3개(아침/점심/저녁 각 1개), 카페는 하루 최대 1개로 제한하십시오.
- 나머지 2~3개는 반드시 관광명소·액티비티·체험·힐링 등 비식사·비카페 장소로 채우십시오.
- 같은 카테고리(식당→식당, 카페→카페)를 연속 배치하지 마십시오.
""".strip()