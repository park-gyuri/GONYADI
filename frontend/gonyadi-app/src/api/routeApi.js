import { apiClient } from './apiClient';
import { mockApiData } from '../data/dummyData';

/**
 * [routeApi.js]
 * 사용자 여행 경로와 관련된 API 통신만 집중적으로 관리하는 곳
 * 관련 화면: RecommendInputScreen.js (추천 요청 시), RouteResultScreen.js (추천 결과 볼 때 등)
 */

/**
 * 1. 백엔드로 새로운 경로를 추천해달라고 요청하는 기능
 * - RecommendInputScreen 에서 사용자가 입력한 데이터를 받아서
 * - 백엔드 API인 /api/routes/recommend (예시)로 보냄
 * 
 * @param {Object} formData 사용자가 입력한 데이터 (예: { destination: '서울', styles: ['도보', '힐링']})
 * @returns {Promise<Object>} 백엔드를 거쳐 반환된 Gemini 추천 결과
 */
export const requestNewRoute = async (formData) => {
  const endpoint = '/api/v1/recommend';

  // 경로 추천은 외부 API를 여러 번 호출해서 오래 걸림 → 90초 타임아웃
  return await apiClient(endpoint, {
    method: 'POST',
    body: JSON.stringify(formData),
  }, 90000);
};

// 서버 IP와 포트 -> 어떻게 맞춰서 연결 테스트를 진행할지 (스마트폰/애뮬레이터 환경 정보 포함)
// 엔드포인트(주소) 이름 -> 경로 추천을 요청할 URI 명칭 (백엔드와 논의 후 수정)

/** 데이터 형태 맞추기: 
 *  - 프론트엔드는 백엔드에 요청 시 데이터를 담은 변수 이름 명칭이 일치해야함
 *  (예: 백엔드가 { destination: '서울' }을 기대하는데, 프론트가 { place: '서울' }로 보내면 통신 실패)
 *  - 백엔드는 응답 받아왔을 때 결과물은 어떤 구조로 응답해주는지?
*/

/**
 * 2. 내비게이션 바 등에서 이미 저장된 '내 여행 경로 목록'을 보고 싶을 때
 * - 백엔드에서 내가 저장한 글 묶음을 쭉 보여달라는 기능 (필요할 때 써보세요)
 */
export const getMyRoutes = async () => {
  return await apiClient('/api/v1/itineraries');
};

/**
 * 3. 내 폴더 목록 조회
 */
export const getFolders = async () => {
  return await apiClient('/api/v1/folders');
};

/**
 * 4. 새 폴더 생성
 * @param {Object} folderData { name: '새 폴더명' }
 */
export const createFolder = async (folderData) => {
  return await apiClient('/api/v1/folders', {
    method: 'POST',
    body: JSON.stringify(folderData),
  });
};

export const updateFolderApi = async (folderId, newName) => {
  return await apiClient(`/api/v1/folders/${folderId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: newName }),
  });
};

export const deleteFolderApi = async (folderId) => {
  return await apiClient(`/api/v1/folders/${folderId}`, {
    method: 'DELETE',
  });
};

/**
 * 5. 경로 저장 (Itinerary 생성)
 * @param {Object} itineraryData 경로 저장 데이터
 */
export const saveItinerary = async (itineraryData) => {
  return await apiClient('/api/v1/itineraries', {
    method: 'POST',
    body: JSON.stringify(itineraryData),
  });
};

/**
 * 6. 경로 상세 조회 (Itinerary 단건 조회)
 * @param {number} itineraryId 일정 PK
 */
export const getItineraryDetail = async (itineraryId) => {
  return await apiClient(`/api/v1/itineraries/${itineraryId}`);
};

