/**
 * apiClient.js
 * 프론트엔드와 백엔드 통신의 기본 뼈대 역할을 하는 파일
 * 백엔드 팀원과 통신 테스트를 진행할 때, 여기 설정들을 맞춰가기
 */

import { Platform } from 'react-native';

// 1. 서버 주소 설정
// .env 파일의 EXPO_PUBLIC_API_URL 값을 최우선으로 사용합니다.
// 값이 없을 경우 플랫폼별 기본값을 사용합니다.
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  // iOS 시뮬레이터
  return 'http://localhost:8000';
};

export const BASE_URL = getBaseUrl();

// 2. 공통 호출 함수 만들기
export const apiClient = async (endpoint, options = {}) => {
  // 최종 요청을 보낼 주소
  const url = `${BASE_URL}${endpoint}`;

  // 기본적으로 데이터를 주고받을 땐 JSON 형식을 쓴다고 알려주는 헤더
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // 요청 옵션 조립 (원래 옵션과 헤더를 합치기)
  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    // 디버깅 편의를 위해 요청이 어떻게 나가는지 콘솔에 찍어줍니다. (실 운용 땐 지워도 됨)
    console.log(`[통신 시도] ${finalOptions.method || 'GET'} ${url}`);
    if (finalOptions.body) {
      console.log(`[요청 데이터]`, finalOptions.body);
    }

    // 실제 요청 보내기
    const response = await fetch(url, finalOptions);

    // 서버에서 에러(400, 500 등)를 뱉었을 때 화면단으로 에러 넘기기
    if (!response.ok) {
      let errorMessage = `서버 응답 오류 (상태 코드: ${response.status})`;
      try {
        // 백엔드에서 JSON으로 에러 원인을 보내줬다면 그걸 읽어옵니다.
        const errorData = await response.json();
        // FastAPI는 에러를 { detail: "..." } 형태로 보냄
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // 백엔드가 JSON 응답조차 안 줄 경우의 대비책
      }
      throw new Error(errorMessage);
    }

    // 서버가 멀쩡히 응답(200번대)했다면 데이터를 파싱해서 돌려줌
    const data = await response.json();
    console.log(`[통신 성공] ${endpoint}`);
    return data;

  } catch (error) {
    console.error(`[통신 실패] ${endpoint} 오류:`, error.message);
    throw error; // 화면(Screen) 컴포넌트로 에러를 그대로 전달
  }
};
