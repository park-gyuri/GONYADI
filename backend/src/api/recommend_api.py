import asyncio
import math
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.recommend_schema import (
    RecommendRequest, RecommendResponse, SegmentRouteRequest,
    RouteSegment, RouteDetail, DaySchedule, PlaceResult,
)
from src.services.prompt_builder import build_rag_prompt
from src.services.gemini import get_gemini_curated_places, critique_and_revise_itinerary, parse_user_intent
from src.services.google_routes import build_route_segments
from src.services.rag_retrieval import retrieve_and_filter_candidates, MIN_CANDIDATES, fetch_google_places_text_search
import src.crud.place_crud as place_crud


router = APIRouter(prefix="/recommend", tags=["recommend"])


def _insert_places(schedule: list, places_to_add: list, pos) -> None:
    """InsertPosition에 따라 schedule 내 올바른 위치에 places_to_add를 삽입 (in-place)."""
    if not schedule:
        return

    # 대상 일차 결정
    if pos and pos.day is not None:
        target = next((d for d in schedule if d.day == pos.day), schedule[-1])
    else:
        target = schedule[-1]

    if pos is None:
        # 위치 미지정 → 맨 끝
        target.places.extend(places_to_add)
        return

    # after_place / before_place 기반 삽입
    if pos.after_place or pos.before_place:
        ref_name = pos.after_place or pos.before_place
        for i, p in enumerate(target.places):
            if ref_name in p.name or p.name in ref_name:
                insert_idx = i + 1 if pos.after_place else i
                for j, new_p in enumerate(places_to_add):
                    target.places.insert(insert_idx + j, new_p)
                return
        # 참조 장소를 못 찾으면 맨 끝에 추가
        target.places.extend(places_to_add)
        return

    # index 기반 삽입 (1-based)
    if pos.index is not None:
        insert_idx = max(0, min(pos.index - 1, len(target.places)))
        for j, new_p in enumerate(places_to_add):
            target.places.insert(insert_idx + j, new_p)
        return

    # 그 외 → 맨 끝
    target.places.extend(places_to_add)



async def _geocode_region(region: str) -> tuple[float, float] | None:
    """지역명을 Google Places Text Search로 좌표로 변환. 실패 시 None 반환."""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        print("[Geocoding] GOOGLE_MAPS_API_KEY 없음")
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": api_key,
                    "X-Goog-FieldMask": "places.location,places.displayName",
                },
                json={
                    "textQuery": f"{region} 한국",
                    "maxResultCount": 1,
                    "languageCode": "ko",
                },
            )
            data = resp.json()
        places = data.get("places", [])
        if places:
            loc = places[0].get("location", {})
            lat = loc.get("latitude")
            lng = loc.get("longitude")
            if lat and lng:
                print(f"[Geocoding] '{region}' → ({lat}, {lng})")
                return lat, lng
        print(f"[Geocoding] '{region}' 검색 결과 없음")
    except Exception as e:
        print(f"[Geocoding] '{region}' 변환 실패: {e}")
    return None


def _build_route_segments(places_from_ai, transport_names) -> list[RouteSegment]:
    raw_segments = build_route_segments(places_from_ai, transport_names)
    route_segments: list[RouteSegment] = []
    for seg in raw_segments:
        routes_typed = {}
        for mode_key, route_data in seg["routes"].items():
            routes_typed[mode_key] = RouteDetail(**route_data) if route_data else None
        route_segments.append(
            RouteSegment(
                from_name=seg["from_name"],
                to_name=seg["to_name"],
                routes=routes_typed,
            )
        )
    return route_segments


_MEAL_CATS  = {"맛집", "식당", "음식점", "레스토랑"}
_CAFE_CATS  = {"카페"}
_MEAL_PER_DAY = 3
_MAX_PER_DAY  = 7

def _enforce_meal_structure(
    schedule: list[DaySchedule],
    review_candidates: list["PlaceCandidate"],  # noqa: F821
) -> list[DaySchedule]:
    """
    Gemini가 고치지 못한 식사 장소 부족을 프로그래매틱으로 보정한다.
    review_candidates 풀에서 맛집을 꺼내 비식사·비카페 장소와 교체한다.
    """
    used_names = {p.name for d in schedule for p in d.places}
    meal_pool = [
        c for c in review_candidates
        if c.category in _MEAL_CATS and c.name not in used_names
    ]

    for day_sched in schedule:
        places = day_sched.places
        meal_count = sum(1 for p in places if p.category in _MEAL_CATS)
        shortage = _MEAL_PER_DAY - meal_count
        if shortage <= 0 or not meal_pool:
            continue

        # 삽입 위치: 저녁(마지막) → 점심(중간) → 아침(처음) 순으로 채움
        insert_positions = {
            1: [len(places) - 1],            # 저녁: 마지막 자리
            2: [len(places) // 2, len(places) - 1],  # 점심 + 저녁
        }.get(meal_count, [0, len(places) // 2, len(places) - 1])

        for pos in insert_positions[:shortage]:
            if not meal_pool:
                break
            cand = meal_pool.pop(0)
            meal_place = PlaceResult(
                name=cand.name, lat=cand.lat, lng=cand.lng,
                reason="일정 균형을 위한 식사 장소 보충",
                duration=60, category=cand.category,
            )
            # pos 자리의 비식사·비카페 장소를 교체, 없으면 append
            replaced = False
            for i in range(min(pos, len(places) - 1), -1, -1):
                if places[i].category not in (_MEAL_CATS | _CAFE_CATS):
                    print(f"[식사 보충] Day {day_sched.day}: '{places[i].name}'({places[i].category}) → '{cand.name}'(맛집)")
                    places[i] = meal_place
                    replaced = True
                    break
            if not replaced and len(places) < _MAX_PER_DAY:
                places.append(meal_place)
                print(f"[식사 보충] Day {day_sched.day}: '{cand.name}' 추가")
            used_names.add(cand.name)

        day_sched.places = places
    return schedule


def _check_schedule_rules(schedule: list[DaySchedule], conditions: list[str]) -> None:
    """최종 일정의 프롬프트 규칙 준수 여부를 로그로 출력한다."""
    print("\n" + "="*60)
    print("[규칙 검사] 최종 일정 프롬프트 규칙 준수 여부")
    print("="*60)

    total_violations = 0

    for day_sched in schedule:
        day = day_sched.day
        places = day_sched.places
        cats = [p.category for p in places]
        violations = []

        # 일정 구조 출력
        structure = " → ".join(f"[{p.category}]{p.name}" for p in places)
        print(f"\nDay {day} ({len(places)}개): {structure}")

        # 규칙 1: 하루 6~7개 장소
        if not (6 <= len(places) <= 7):
            violations.append(f"장소 수 {len(places)}개 (규칙: 6~7개)")

        # 규칙 2: 식사 장소 3개 (아침/점심/저녁)
        meal_count = sum(1 for c in cats if c in _MEAL_CATS)
        if meal_count < 3:
            violations.append(f"식사 장소 {meal_count}개 (규칙: 3개 — 아침/점심/저녁 미충족)")
        elif meal_count > 3:
            violations.append(f"식사 장소 {meal_count}개 (규칙: 최대 3개 초과)")

        # 규칙 3: 카페 최대 1개
        cafe_count = sum(1 for c in cats if c in _CAFE_CATS)
        if cafe_count > 1:
            violations.append(f"카페 {cafe_count}개 (규칙: 최대 1개)")

        # 규칙 4: 연속 동일 카테고리 (식사·카페)
        for i in range(len(cats) - 1):
            if cats[i] == cats[i + 1] and cats[i] in (_MEAL_CATS | _CAFE_CATS):
                violations.append(
                    f"연속 동일 카테고리: [{cats[i]}] order {i+1}→{i+2} "
                    f"({places[i].name} → {places[i+1].name})"
                )

        # 규칙 5: 하루 구조 — 첫 번째 장소가 식사인지
        if places and cats[0] not in _MEAL_CATS:
            violations.append(f"첫 장소가 식사 아님: [{cats[0]}]{places[0].name} (규칙: 아침 식사 먼저)")

        # 규칙 6: 조건 — 휠체어 (접근성 미확인 장소가 있으면 경고)
        if "휠체어" in conditions:
            unconfirmed = [p.name for p in places if getattr(p, "accessibility_unconfirmed", False)]
            if unconfirmed:
                violations.append(f"휠체어 조건 — 접근성 미확인 장소: {unconfirmed}")

        # 규칙 7: 조건 — 반려동물 (펫 미확인 장소가 있으면 경고)
        if "반려동물 동반" in conditions:
            unconfirmed = [p.name for p in places if getattr(p, "pet_unconfirmed", False)]
            if unconfirmed:
                violations.append(f"반려동물 조건 — 입장 미확인 장소: {unconfirmed}")

        if violations:
            for v in violations:
                print(f"  ❌ {v}")
            total_violations += len(violations)
        else:
            print(f"  ✅ 모든 규칙 준수")

    print("\n" + "-"*60)
    if total_violations == 0:
        print(f"[규칙 검사] 전체 결과: ✅ 위반 없음")
    else:
        print(f"[규칙 검사] 전체 결과: ❌ 총 {total_violations}건 위반")
    print("="*60 + "\n")


def _flat_to_schedule(places: list[PlaceResult], total_days: int) -> list[DaySchedule]:
    if not places:
        return []
    per_day = math.ceil(len(places) / total_days)
    schedule = []
    for day in range(1, total_days + 1):
        start = (day - 1) * per_day
        end = min(start + per_day, len(places))
        if start < len(places):
            schedule.append(DaySchedule(day=day, places=places[start:end]))
    return schedule


def _schedule_to_route_segments(schedule: list[DaySchedule], transport_names: list[str]) -> list[RouteSegment]:
    all_segments: list[RouteSegment] = []
    for day_sched in schedule:
        if len(day_sched.places) > 1:
            all_segments.extend(_build_route_segments(day_sched.places, transport_names))
    return all_segments


@router.post("/segment-route")
async def get_segment_route(req: SegmentRouteRequest):
    """구간 하나의 경로를 온디맨드로 조회한다 (결과 화면에서 이동수단 변경 시 호출)."""
    from src.services.google_routes import get_route_between_places
    transport_name = req.transport.value
    loop = asyncio.get_event_loop()
    routes = await loop.run_in_executor(
        None,
        get_route_between_places,
        req.origin_lat, req.origin_lng,
        req.dest_lat,   req.dest_lng,
        [transport_name],
    )
    _key_map = {"도보": "walk", "자동차": "drive", "자전거": "bicycle", "대중교통": "transit"}
    mode_key = _key_map[transport_name]
    raw = routes.get(mode_key)
    if raw is None:
        raise HTTPException(status_code=404, detail="해당 구간의 경로를 찾을 수 없습니다.")
    route = RouteDetail(**raw) if not isinstance(raw, RouteDetail) else raw
    return {"mode_key": mode_key, "route": route}


@router.post("", response_model=RecommendResponse)
async def handle_recommendation(
    req: RecommendRequest,
    session: Session = Depends(get_session),
):
    transport_names = [t.value for t in req.transports]
    total_days = req.days or 1

    # ── 좌표 확보: 프론트에서 못 받았으면 백엔드에서 Geocoding 재시도 ─────────
    center_lat = req.center_lat
    center_lng = req.center_lng

    if center_lat is None or center_lng is None:
        print(f"[추천] center_lat/lng 없음 → 백엔드 Geocoding 시도: '{req.region}'")
        coords = await _geocode_region(req.region)
        if coords:
            center_lat, center_lng = coords
            req = req.model_copy(update={"center_lat": center_lat, "center_lng": center_lng})
        else:
            raise HTTPException(
                status_code=422,
                detail=f"'{req.region}' 지역의 좌표를 찾을 수 없습니다. 지역명을 다시 확인해 주세요.",
            )

    # ── 수정 요청 시 Gemini로 의도 파싱 → 케이스별 직접 처리 or 전체 재추천 ──
    if req.original_places and req.user_message.strip():
        loop = asyncio.get_event_loop()
        intent = await loop.run_in_executor(None, parse_user_intent, req.region, req.user_message)
        print(f"[Intent] {intent}")

        # ── Case A: 단순 추가/삭제 → 파이프라인 없이 직접 처리 ────────────────
        if not intent.needs_full_regen and not intent.area and not intent.add_themes:

            schedule = req.original_schedule or _flat_to_schedule(req.original_places, req.days or 1)

            # A-1) 장소 삭제
            if intent.remove_places:
                for day_sched in schedule:
                    day_sched.places = [
                        p for p in day_sched.places
                        if not any(r in p.name or p.name in r for r in intent.remove_places)
                    ]

            # A-2) 장소 추가 (Google Places Text Search로 검색 후 삽입)
            if intent.add_places:
                added: list[PlaceResult] = []
                for keyword in intent.add_places:
                    results = await fetch_google_places_text_search(
                        query=f"{req.region} {keyword}",
                        lat=center_lat, lng=center_lng, max_count=1,
                    )
                    if results:
                        p = results[0]
                        added.append(PlaceResult(
                            name=p["name"], lat=p["lat"], lng=p["lng"],
                            reason=keyword, duration=60, category=p.get("category") or "관광명소",
                        ))

                if added and schedule:
                    _insert_places(schedule, added, intent.insert_position)

            places_from_ai = [p for d in schedule for p in d.places]
            transport_names = [t.value for t in req.transports]
            route_segments = _schedule_to_route_segments(schedule, transport_names)

            return RecommendResponse(
                status="completed",
                prompt_preview=f"[직접 처리] {req.user_message}",
                schedule=schedule,
                places=places_from_ai,
                route_segments=route_segments,
                insufficient_candidates=False,
                shortage_message="",
                current_radius_km=0.0,
            )

        # ── Case B: 지역 변경 / 전체 재추천 → 기존 파이프라인 실행 ────────────
        updates = {}

        if intent.area:
            new_coords = await _geocode_region(f"{req.region} {intent.area}")
            if not new_coords:
                new_coords = await _geocode_region(intent.area)
            if new_coords:
                center_lat, center_lng = new_coords
                updates["center_lat"] = center_lat
                updates["center_lng"] = center_lng

        if intent.remove_places:
            filtered = [
                p for p in req.original_places
                if not any(r in p.name or p.name in r for r in intent.remove_places)
            ]
            updates["original_places"] = filtered

        if intent.add_themes:
            from src.schemas.recommend_schema import ThemeCategories
            existing = {t.value for t in req.themes}
            extra = [ThemeCategories(t) for t in intent.add_themes if t in ThemeCategories._value2member_map_ and t not in existing]
            if extra:
                updates["themes"] = list(req.themes) + extra

        if updates:
            req = req.model_copy(update=updates)

    # ── 초기 추천 요청에도 user_message 파싱 적용 ─────────────────────────────
    elif req.user_message.strip():
        loop = asyncio.get_event_loop()
        intent = await loop.run_in_executor(None, parse_user_intent, req.region, req.user_message)
        print(f"[Intent·초기] {intent}")

        updates = {}

        # 지역 언급 → 검색 좌표 갱신
        if intent.area:
            new_coords = await _geocode_region(f"{req.region} {intent.area}")
            if not new_coords:
                new_coords = await _geocode_region(intent.area)
            if new_coords:
                center_lat, center_lng = new_coords
                updates["center_lat"] = center_lat
                updates["center_lng"] = center_lng

        # 추가 테마 → themes 병합
        if intent.add_themes:
            from src.schemas.recommend_schema import ThemeCategories
            existing = {t.value for t in req.themes}
            extra = [ThemeCategories(t) for t in intent.add_themes if t in ThemeCategories._value2member_map_ and t not in existing]
            if extra:
                updates["themes"] = list(req.themes) + extra

        # 특정 장소 지정 → user_message를 장소명만으로 교체해 RAG 텍스트 검색 정확도 향상
        # (구어체 문장 전체를 Google Places에 던지면 엉뚱한 결과가 나올 수 있음)
        if intent.add_places:
            updates["user_message"] = " ".join(intent.add_places)
            print(f"[Intent·초기] 장소 지정 감지 → user_message 교체: {updates['user_message']}")

        if updates:
            req = req.model_copy(update=updates)

    # ── RAG 파이프라인 ────────────────────────────────────────────────────────
    print(f"[추천] RAG 파이프라인 실행 (center={center_lat},{center_lng})")
    candidates, review_candidates, used_radius_km, pinned_names = await retrieve_and_filter_candidates(req, session)

    if not candidates:
        raise HTTPException(
            status_code=404,
            detail=f"'{req.region}' 주변에서 조건에 맞는 장소를 찾지 못했습니다. 검색 범위나 테마를 변경해 보세요.",
        )

    # 후보 부족 여부 판단 (일수 기반 동적 임계값 사용)
    min_needed = max(MIN_CANDIDATES, total_days * 6)
    insufficient = len(candidates) < min_needed
    shortage_msg = ""
    if insufficient:
        theme_str = "·".join([th.value for th in req.themes])
        shortage_msg = f"'{theme_str}' 장소가 부족합니다. 검색 반경을 넓히시겠습니까?"
        print(f"[추천] 후보 부족 ({len(candidates)}개 < {min_needed}개) — 프론트 팝업 트리거")

    # ── Gemini Curation (1차: Spatial Filter 통과 후보 20개에서 장소 선택) ──────
    # 동기 Gemini 함수를 스레드풀에서 실행해 async 이벤트 루프 블록 방지
    rag_prompt = build_rag_prompt(req, candidates, pinned_names=pinned_names)
    condition_values = [c.value for c in req.conditions]
    loop = asyncio.get_event_loop()
    schedule = await loop.run_in_executor(
        None, get_gemini_curated_places, rag_prompt, candidates, condition_values
    )

    # ── AI 검토 (2차: 중복·비현실적 동선 감지 및 보정) ────────────────────────
    # review_candidates(30개)를 사용해 1차에서 쓰지 않은 장소로도 교체 가능
    if schedule:
        schedule = await loop.run_in_executor(
            None, critique_and_revise_itinerary, schedule, review_candidates, total_days, condition_values
        )

    if not schedule:
        # Gemini 큐레이션 실패 → 검증된 DB 후보 상위 N개를 균등 분할로 fallback
        print("[RAG] Gemini 큐레이션 결과 없음 → DB 후보 직접 사용")
        fallback_places = [
            PlaceResult(
                name=c.name,
                lat=c.lat,
                lng=c.lng,
                reason="",
                duration=60,
                category=c.category,
            )
            for c in candidates[: total_days * 7]
        ]
        schedule = _flat_to_schedule(fallback_places, total_days)

    # DB 플래그 기반 뱃지 설정 + 주소/카테고리 채우기
    candidate_map = {c.name: c for c in review_candidates}
    is_pet_condition        = "반려동물 동반" in condition_values
    is_wheelchair_condition = "휠체어" in condition_values
    print(f"[뱃지] 조건: pet={is_pet_condition}, wheelchair={is_wheelchair_condition}")
    for day_sched in schedule:
        for place in day_sched.places:
            cand = candidate_map.get(place.name)
            accessible_flag = cand.is_accessible if cand else None
            pet_flag        = cand.is_pet_friendly if cand else None
            print(f"[뱃지] {place.name} | is_accessible={accessible_flag} | is_pet_friendly={pet_flag}")
            if is_wheelchair_condition and (cand is None or cand.is_accessible is not True):
                place.accessibility_unconfirmed = True
            if is_pet_condition and (cand is None or cand.is_pet_friendly is not True):
                place.pet_unconfirmed = True
            # DB의 실제 주소와 카테고리로 덮어쓰기
            if cand and cand.address:
                place.address = cand.address
            if cand and cand.category:
                place.category = cand.category

    # Gemini가 미처 고치지 못한 식사 부족을 프로그래매틱으로 최종 보정
    schedule = _enforce_meal_structure(schedule, review_candidates)
    _check_schedule_rules(schedule, condition_values)

    places_from_ai = [p for d in schedule for p in d.places]
    route_segments = _schedule_to_route_segments(schedule, transport_names)

    return RecommendResponse(
        status="completed",
        prompt_preview=rag_prompt,
        schedule=schedule,
        places=places_from_ai,
        route_segments=route_segments,
        insufficient_candidates=insufficient,
        shortage_message=shortage_msg,
        current_radius_km=used_radius_km,
    )
