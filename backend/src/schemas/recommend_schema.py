from __future__ import annotations
from pydantic import BaseModel, Field, model_validator
from enum import StrEnum
from datetime import date
from typing import Optional, Dict


# ── 카테고리 정의 ─────────────────────────────────────────────────────

class ThemeCategories(StrEnum):
    HEALING  = "힐링"
    FOOD     = "맛집"
    PHOTO    = "사진"
    EXHIBIT  = "전시"
    ACTIVITY = "체험"
    CAFE     = "카페"
    LEISURE  = "오락/레저"
    HISTORY  = "역사"
    CULTURE  = "문화"
    SHOPPING = "쇼핑"
    FESTIVAL = "축제"
    NATURE   = "자연"


class TransportCategories(StrEnum):
    WALK    = "도보"
    CAR     = "자동차"
    BIKE    = "자전거"
    TRANSIT = "대중교통"


class ConditionCategories(StrEnum):
    WHEELCHAIR = "휠체어"
    PET        = "반려동물 동반"
    CHILD      = "어린이 동반"


# ── Gemini에게 추천받을 장소 스키마 ───────────────────────────────────────
class PlaceResult(BaseModel):
    # Gemini가 추천하는 장소 하나
    name:        str    # 장소 이름
    lat:         float  # 위도
    lng:         float  # 경도
    reason:      str    # 추천 사유
    duration:    int    # 예상 소요 시간 (분)
    category:    str    # 장소 카테고리


# ── 요청 스키마 ───────────────────────────────────────────────────

class RecommendRequest(BaseModel):

    # 여행 지역 
    region: str = Field(..., min_length=1, max_length=100)

    # 날짜 
    start_date: Optional[date] = Field(None)
    end_date:   Optional[date] = Field(None)

    # 기간 
    nights: Optional[int] = Field(None, ge=0, le=29)
    days:   Optional[int] = Field(None, ge=1,  le=30)

    # 인원 
    number_of_people: int = Field(2, ge=1, le=30)

    # 1인 예산 
    budget_per_person: Optional[int] = Field(None, ge=0)

    # 카테고리
    transports: list[TransportCategories] = Field(..., min_length=1, max_length=3)
    themes: list[ThemeCategories] = Field(..., min_length=1, max_length=9)
    conditions: list[ConditionCategories] = Field(default=[])

    # 상세 요청 
    user_message: str = Field("", max_length=500)

    # 기존 일정 (재추천 기능 시 프론트엔드에서 기존에 받았던 장소 배열을 다시 전달)
    original_places: Optional[list[PlaceResult]] = Field(default=None)



    # ── 날짜 및 기간 검증 메서드 ─────────────────────────────────────────
    @model_validator(mode="after")
    def validate_schedule(self) -> RecommendRequest:

        has_dates = self.start_date is not None and self.end_date is not None
        has_duration = self.nights is not None and self.days is not None

        if not has_dates and not has_duration:
            raise ValueError("일정(달력) 또는 여행 기간(박/일) 중 하나는 필수입니다.")

        if (self.start_date is None) != (self.end_date is None):
            raise ValueError("시작일과 종료일을 함께 선택해 주세요.")

        if (self.nights is None) != (self.days is None):
            raise ValueError("박과 일은 함께 입력해야 합니다.")

        if has_dates and self.end_date < self.start_date: # type: ignore
            raise ValueError("종료일은 시작일 이후여야 합니다.")
        
        '''

        if has_duration and self.days != self.nights + 1:
            raise ValueError(f"{self.nights}박은 {self.nights + 1}일이어야 합니다.")
        if has_dates and has_duration:
            date_days = (self.end_date - self.start_date).days + 1
            if date_days != self.days:
                raise ValueError(
                    f"달력 기간({date_days}일)과 입력 기간({self.days}일)이 일치하지 않습니다."
                )
        '''

        return self


# ── Google Routes API 경로 정보 스키마 ────────────────────────────────────

class RouteDetail(BaseModel):
    """단일 이동 수단의 경로 세부 정보"""
    travel_mode:      str                   # "walk" | "drive"
    duration_seconds: int                   # 소요 시간 (초)
    duration_minutes: float                 # 소요 시간 (분)
    distance_meters:  int                   # 이동 거리 (미터)
    polyline:         list[list[float]] = []  # [[lat, lng], ...] 폴리라인 좌표 (TMAP 반환값)


class RouteSegment(BaseModel):
    """인접한 두 장소 사이의 이동 수단별 경로 묶음"""
    from_name: str                              # 출발 장소명
    to_name:   str                              # 도착 장소명
    routes:    Dict[str, Optional[RouteDetail]] # 키: 이동수단(walk/drive/...), 값: RouteDetail 또는 None


# ── 프론트 응답 스키마 ───────────────────────────────────────────────────

class RecommendResponse(BaseModel):
    status:         str                 # "completed" - 현재 상태
    prompt_preview: str                 # 실제로 AI에 넘길 프롬프트 (디버그용)
    places:         list[PlaceResult]   # Gemini가 추천한 장소 리스트
    route_segments: list[RouteSegment]  # 장소 간 이동 경로 (Google Routes API)
    # message:        str  # 프론트 로딩 화면(화면 B)에 보여줄 문구



