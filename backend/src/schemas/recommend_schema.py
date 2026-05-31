from __future__ import annotations
from pydantic import BaseModel, Field, model_validator
from enum import StrEnum
from datetime import date
from typing import Optional, Dict, List


# ── 카테고리 정의 ─────────────────────────────────────────────────────

class ThemeCategories(StrEnum):
    HEALING  = "힐링"
    FOOD     = "맛집"
    PHOTO    = "사진"
    EXHIBIT  = "전시"
    ACTIVITY = "체험"
    CAFE     = "카페"
    ARCADE   = "오락"
    LEISURE  = "레저"
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
    name:                     str   # 장소 이름
    lat:                      float # 위도
    lng:                      float # 경도
    reason:                   str   # 추천 사유
    duration:                 int   # 예상 소요 시간 (분)
    category:                 str   # 장소 카테고리
    address:                  Optional[str] = None  # 실제 주소 (DB에서 채움)
    accessibility_unconfirmed: bool = False  # 휠체어 조건 시 접근성 미확인 장소 여부
    pet_unconfirmed:           bool = False  # 반려동물 조건 시 동반 가능 여부 미확인


# ── [RAG] DB에서 꺼낸 후보 장소 스키마 ────────────────────────────────────────
class PlaceCandidate(BaseModel):
    """DB의 Places 테이블에서 조회한 후보 장소 (LLM에게 넘겨줄 데이터)"""
    place_pk:        int
    name:            str
    lat:             float
    lng:             float
    category:        str
    address:         Optional[str] = None
    distance_km:     float
    is_pet_friendly:     Optional[bool] = None  # None=미확인, True=가능
    is_accessible:       Optional[bool] = None  # None=미확인, True=무장애 가능
    festival_start_date: Optional[str]  = None  # YYYYMMDD
    festival_end_date:   Optional[str]  = None  # YYYYMMDD


# ── [RAG] LLM(Gemini)이 후보 리스트를 보고 반환하는 최소 스키마 ──────────────────
class CuratedPlaceResult(BaseModel):
    """Gemini가 후보 리스트 안에서만 선택해 반환하는 스키마 (새 장소 생성 금지)"""
    place_pk: int   # PlaceCandidate.place_pk 중 하나여야 함
    day:      int   # 여행 일차 (1부터 시작)
    order:    int   # 해당 일차 내 방문 순서 (1부터 시작)
    reason:   str   # 추천 사유
    duration: int   # 예상 소요 시간 (분)


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
    themes: list[ThemeCategories] = Field(..., min_length=1, max_length=13)
    conditions: list[ConditionCategories] = Field(default=[])

    # 상세 요청 
    user_message: str = Field("", max_length=500)

    # 기존 일정 (재추천 기능 시 프론트엔드에서 기존에 받았던 장소 배열을 다시 전달)
    original_places: Optional[list[PlaceResult]] = Field(default=None)
    # 일차별 구조 보존용 (original_places의 일차 정보 포함 버전)
    original_schedule: Optional[list[DaySchedule]] = Field(default=None)

    # [RAG] 중심 좌표 (프론트엔드에서 지도 중심점 또는 사용자 현재 위치 전달)
    # None이면 region 문자열 기반 기존 방식으로 fallback
    center_lat: Optional[float] = Field(default=None, description="검색 중심 위도")
    center_lng: Optional[float] = Field(default=None, description="검색 중심 경도")
    radius_km:  Optional[float] = Field(default=None, ge=0.5, le=50.0, description="검색 반경(km). None이면 이동수단 기반 자동 결정")



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


class LaneInfo(BaseModel):
    """ODsay 대중교통 차선(노선) 정보"""
    # 버스 관련
    busNo:      Optional[str] = None   # 버스 번호 (예: "472")
    type:       Optional[int] = None   # 버스 종류 코드 (4=간선, 5=지선, 10=광역 등)
    # 지하철 관련
    name:       Optional[str] = None   # 호선명 (예: "수도권 2호선")
    subwayCode: Optional[int] = None   # 지하철 색상 코드 (1~9)


class SubPathDetail(BaseModel):
    """ODsay 대중교통 세부 구간 (subPath 하나)"""
    trafficType:  int                    # 1=지하철, 2=버스, 3=도보
    sectionTime:  int                    # 구간 소요 시간 (분)
    distance:     Optional[int]   = None # 이동 거리 (m) — 도보 구간에서 주로 사용
    stationCount: Optional[int]   = None # 정거장 수 (지하철/버스)
    startName:    Optional[str]   = None # 출발 정류장/역명
    endName:      Optional[str]   = None # 도착 정류장/역명
    way:          Optional[str]   = None # 지하철 방면 (예: "잠실 방면")
    lane:         List[LaneInfo]  = []   # 노선 정보 목록
    # 지도 렌더링용 구간 좌표 (trafficType별로 채워지는 방식이 다름)
    # - 지하철/버스: passStopList.stations 좌표 (현재 방식)
    # - 추후 loadLane API로 교체 시 _build_subpath_polyline()만 수정하면 됨
    polyline:     List[List[float]] = [] # [[lat, lng], ...] 이 구간의 지도 좌표
    # 도보 구간 시작/끝 좌표 (직선 연결용)
    startX:       Optional[float] = None # 출발 경도
    startY:       Optional[float] = None # 출발 위도
    endX:         Optional[float] = None # 도착 경도
    endY:         Optional[float] = None # 도착 위도


class RouteDetail(BaseModel):
    """단일 이동 수단의 경로 세부 정보"""
    travel_mode:      str                   # "walk" | "drive" | "transit" | "bicycle"
    duration_seconds: int                   # 소요 시간 (초)
    duration_minutes: float                 # 소요 시간 (분)
    distance_meters:  int                   # 이동 거리 (미터)
    polyline:         list[list[float]] = []  # [[lat, lng], ...] 폴리라인 좌표
    # 대중교통 전용 상세 정보 (transit 모드일 때만 채워짐)
    transit_sub_paths:  List[SubPathDetail] = []  # 구간별 상세 (도보/버스/지하철 분리)
    transit_total_walk: Optional[int]       = None # 총 도보 거리 (m)
    transit_payment:    Optional[int]       = None # 요금 (원)
    # 폴백 상태 표시 ("success" | "walking_fallback" | None)
    transit_status:     Optional[str]       = None
    transit_message:    Optional[str]       = None # 프론트 배너에 표시할 메시지


class RouteSegment(BaseModel):
    """인접한 두 장소 사이의 이동 수단별 경로 묶음"""
    from_name: str                              # 출발 장소명
    to_name:   str                              # 도착 장소명
    routes:    Dict[str, Optional[RouteDetail]] # 키: 이동수단(walk/drive/...), 값: RouteDetail 또는 None


# ── 일차별 일정 스키마 ────────────────────────────────────────────────────

class DaySchedule(BaseModel):
    day:    int              # 1일차, 2일차, ...
    places: list[PlaceResult]


# ── 프론트 응답 스키마 ───────────────────────────────────────────────────

class SegmentRouteRequest(BaseModel):
    """단일 구간 경로 온디맨드 조회 요청"""
    origin_lat: float
    origin_lng: float
    dest_lat:   float
    dest_lng:   float
    transport:  TransportCategories


class RecommendResponse(BaseModel):
    status:                  str                 # "completed" - 현재 상태
    prompt_preview:          str                 # 실제로 AI에 넘길 프롬프트 (디버그용)
    schedule:                list[DaySchedule]   # 일차별 장소 (1일차, 2일차 ...)
    places:                  list[PlaceResult]   # 전체 장소 flat 리스트 (하위 호환)
    route_segments:          list[RouteSegment]  # 일차 내 장소 간 이동 경로
    insufficient_candidates: bool  = False       # 후보 장소 부족 여부
    shortage_message:        str   = ""          # 부족 안내 문구 (프론트 팝업용)
    current_radius_km:       float = 0.0         # 이번 검색에 사용된 반경 (km)



