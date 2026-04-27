import { apiClient } from './apiClient';

/**
 * [routeApi.js]
 * 사용자 여행 경로와 관련된 API 통신만 집중적으로 관리하는 곳
 * 관련 화면: RecommendInputScreen.js (추천 요청 시), RouteResultScreen.js (추천 결과 볼 때 등)
 */

// ── 프론트 태그 → 백엔드 스키마 매핑 테이블 ────────────────────────────

// 이동수단 태그 (프론트와 백엔드 이름 동일)
const TRANSPORT_TAGS = ['도보', '자동차', '자전거', '대중교통'];

// 여행테마 태그 매핑 (프론트 이름 → 백엔드 Enum 값)
const THEME_TAG_MAP = {
  '힐링': '힐링',
  '음식': '맛집',      // 프론트 "음식" → 백엔드 "맛집"
  '카페': '카페',
  '사진': '사진',
  '전시': '전시',
  '체험': '체험',
  '쇼핑': '쇼핑',
  '역사': '역사',
  '축제': '축제',
  '자연': '자연',
  '액티비티': '오락/레저',  // 프론트 "액티비티" → 백엔드 "오락/레저"
};

// 여행조건 태그 (프론트와 백엔드 이름 동일)
const CONDITION_TAGS = ['휠체어', '반려동물 동반', '어린이 동반'];

// 예산 문자열 → 숫자 변환
const parseBudget = (budgetStr) => {
  if (!budgetStr) return null;

  // "1,000,000 이상" → 1000000
  if (budgetStr.includes('이상')) {
    const num = budgetStr.replace(/[^0-9]/g, '');
    return parseInt(num, 10) || null;
  }
  // "100,000 ~ 300,000" → 상한값(300000) 사용
  const parts = budgetStr.split('~');
  if (parts.length === 2) {
    const upper = parts[1].replace(/[^0-9]/g, '');
    return parseInt(upper, 10) || null;
  }
  return null;
};


/**
 * 1. 프론트 폼 데이터 → 백엔드 RecommendRequest 스키마로 변환
 */
const buildRequestBody = (formData) => {
  const {
    destination,     // 여행지
    startDate,       // 시작일 (YYYY-MM-DD 문자열 또는 '')
    endDate,         // 종료일
    nights,          // 박 수 (문자열)
    days,            // 일 수 (문자열)
    personCount,     // 인원 수 (숫자)
    selectedBudget,  // 예산 (문자열)
    selectedTags,    // 선택된 태그 배열
    userMessage,     // 상세 요청 텍스트
    original_places, // 재추천용 기존 일정 (있을 경우에만)
  } = formData;

  // 태그를 이동수단 / 테마 / 조건으로 분류
  const transports = selectedTags.filter(tag => TRANSPORT_TAGS.includes(tag));
  const themes = selectedTags
    .filter(tag => tag in THEME_TAG_MAP)
    .map(tag => THEME_TAG_MAP[tag]);
  const conditions = selectedTags.filter(tag => CONDITION_TAGS.includes(tag));

  // 이동수단이 하나도 없으면 기본값 "도보" 추가
  if (transports.length === 0) {
    transports.push('도보');
  }
  // 테마가 하나도 없으면 기본값 "힐링" 추가
  if (themes.length === 0) {
    themes.push('힐링');
  }

  return {
    region: destination,
    start_date: startDate || null,
    end_date: endDate || null,
    nights: nights ? parseInt(nights, 10) : null,
    days: days ? parseInt(days, 10) : null,
    number_of_people: personCount,
    budget_per_person: parseBudget(selectedBudget),
    transports,
    themes,
    conditions,
    user_message: userMessage || '',
    original_places: original_places || null,
  };
};


/**
 * 2. 백엔드로 경로 추천 요청
 * 
 * @param {Object} formData - RecommendInputScreen에서 모은 폼 데이터
 * @returns {Promise<Object>} 백엔드 RecommendResponse
 *   { status, prompt_preview, places: PlaceResult[], route_segments: RouteSegment[] }
 */
export const requestNewRoute = async (formData) => {
  const requestBody = buildRequestBody(formData);

  console.log('[routeApi] 추천 요청 데이터:', JSON.stringify(requestBody, null, 2));

  return await apiClient('/api/v1/recommend', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
};


/**
 * 3. 내가 저장한 여행 경로 목록 조회 (추후 구현)
 */
export const getMyRoutes = async () => {
  return await apiClient('/api/v1/routes/my', {
    method: 'GET',
  });
};
