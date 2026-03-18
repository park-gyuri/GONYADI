
from __future__ import annotations
from enum import StrEnum
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, model_validator

# --- 카테고리 정의 (Enum) ---

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

class TransportCategories(StrEnum):
    WALK    = "도보"
    CAR     = "자동차"
    BIKE    = "자전거"
    TRANSIT = "대중교통"

class ConditionCategories(StrEnum):
    WHEELCHAIR = "휠체어"
    PET        = "반려동물 동반"

# --- Request 스키마 정의 ---

class RecommendRequest(BaseModel):
    # 여행 지역
    region: str = Field(..., min_length=1, max_length=100)

    # 날짜
    start_date: Optional[date] = Field(None)
    end_date: Optional[date] = Field(None)

    # 기간
    nights: Optional[int] = Field(None, ge=0, le=29)
    days: Optional[int] = Field(None, ge=1, le=30)

    # 인원
    number_of_people: int = Field(2, ge=1, le=30)

    # 1인 예산
    budget_per_person: Optional[int] = Field(None)

    # 카테고리
    transports: list[TransportCategories] = Field(..., min_length=1, max_length=3)
    themes: list[ThemeCategories] = Field(..., min_length=1, max_length=9)
    conditions: list[ConditionCategories] = Field(default=[])

    # 상세 요청
    user_message: str = Field("", max_length=500)

    # 날짜 및 기간 검증 함수
    @model_validator(mode="after")
    def validate_schedule(self) -> "RecommendRequest":
        has_dates = self.start_date is not None and self.end_date is not None
        has_duration = self.nights is not None and self.days is not None

        # 일정 또는 기간 중 하나는 필수
        if not has_dates and not has_duration:
            raise ValueError("일정(달력) 또는 여행 기간(박/일) 중 하나는 필수입니다.")

        # 시작일/종료일 짝 확인
        if (self.start_date is None) != (self.end_date is None):
            raise ValueError("시작일과 종료일을 함께 선택해 주세요.")

        # 박/일 짝 확인
        if (self.nights is None) != (self.days is None):
            raise ValueError("박과 일은 함께 입력해야 합니다.")

        # 종료일이 시작일보다 빠른지 확인
        if has_dates and self.end_date < self.start_date:
            raise ValueError("종료일은 시작일 이후여야 합니다.")

        # 박/일 계산 일치 확인
        if has_duration and self.days != self.nights + 1:
            raise ValueError(f"{self.nights}박은 {self.nights + 1}일이어야 합니다.")

        # 달력 날짜와 입력된 기간(days) 일치 확인
        if has_dates and has_duration:
            date_days = (self.end_date - self.start_date).days + 1
            if date_days != self.days:
                raise ValueError(
                    f"달력 기간({date_days}일)과 입력 기간({self.days}일)이 일치하지 않습니다."
                )
        
        return self