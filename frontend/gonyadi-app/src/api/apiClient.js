/**
 * apiClient.js
 * 프론트엔드와 백엔드 통신의 기본 뼈대 역할을 하는 파일
 * 백엔드 팀원과 통신 테스트를 진행할 때, 여기 설정들을 맞춰가기
 *
 * [서버 주소 설정 방법]
 * - 기본: Expo Dev Server가 자동으로 PC IP를 감지하여 백엔드에 연결
 * - 수동: frontend/gonyadi-app/.env 에 EXPO_PUBLIC_API_URL=http://IP:8000 설정
 * - 배포: .env에 배포 서버 주소 입력 (예: https://api.gonyadi.com)
 */
import Constants from 'expo-constants';

/**
 * 백엔드 BASE_URL을 자동으로 결정한다.
 * 우선순위: .env 명시값 > Expo 자동 감지 IP > localhost
 */
function getBaseUrl() {
  // 1) .env에 EXPO_PUBLIC_API_URL이 설정된 경우 (수동 지정)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2) Expo Dev Server에서 자동으로 감지된 호스트 IP 사용
  //    같은 WiFi에 연결되어 있으면 IP 변경 없이 자동 연결됨
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8000`;
  }

  // 3) 기본값 (웹 브라우저 등)
  return 'http://localhost:8000';
}

export const BASE_URL = getBaseUrl();
console.log(`[apiClient] 백엔드 서버 주소: ${BASE_URL}`);

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

    // 실제 요청 보내기
    const response = await fetch(url, finalOptions);

    // 서버에서 에러(400, 500 등)를 뱉었을 때 화면단으로 에러 넘기기
    if (!response.ok) {
      let errorMessage = `서버 응답 오류 (상태 코드: ${response.status})`;
      try {
        // 백엔드에서 JSON으로 에러 원인을 보내줬다면 그걸 읽어옵니다.
        const errorData = await response.json();
        console.error("백엔드 상세 에러:", JSON.stringify(errorData, null, 2));

        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n');
        } else {
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        // 백엔드가 JSON 응답조차 안 줄 경우의 대비책
      }
      throw new Error(errorMessage);
    }

    // 서버가 멀쩡히 응답(200번대)했다면 데이터를 파싱해서 돌려줌
    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`[통신 실패] ${endpoint} 오류:`, error.message);
    throw error; // 화면(Screen) 컴포넌트로 에러를 그대로 전달
  }
};
