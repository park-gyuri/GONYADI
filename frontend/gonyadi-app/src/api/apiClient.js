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
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const getFullImageUrl = (url) => {
  if (!url) return null;
  if (typeof url !== 'string') return url;
  if (url.startsWith('http')) return url;
  if (url.startsWith('file://')) return url;
  
  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  }
  return `${BASE_URL}/${url}`;
};

// 2. 공통 호출 함수 만들기
// timeout: 기본 10초. 경로 추천처럼 오래 걸리는 요청은 호출 시 늘려서 사용
export const apiClient = async (endpoint, options = {}, timeout = 10000) => {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  // 저장된 토큰이 있다면 가져와서 헤더에 추가
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log(`[통신 시도] ${finalOptions.method || 'GET'} ${url}`);

    // AbortController는 Hermes(APK)에서 unhandled exception을 유발할 수 있어
    // Promise.race 방식으로 타임아웃을 구현
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('요청 시간이 초과됐습니다.')), timeout)
    );
    const response = await Promise.race([fetch(url, finalOptions), timeoutPromise]);

    // 1. 서버에서 에러(400, 401, 500 등)를 뱉었을 때
    if (!response.ok) {
      // 🌟 [토큰 만료 시 자동 갱신 로직 추가] 🌟
      if (response.status === 401 && endpoint !== '/api/v1/auth/login' && endpoint !== '/api/v1/auth/refresh') {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            console.log("[apiClient] Access Token 만료 감지, Refresh Token으로 갱신 시도...");
            const refreshUrl = `${BASE_URL}/api/v1/auth/refresh?refresh_token=${refreshToken}`;
            const refreshResp = await fetch(refreshUrl, { method: 'POST' });
            
            if (refreshResp.ok) {
              const refreshData = await refreshResp.json();
              // 새 토큰 저장
              await AsyncStorage.setItem('access_token', refreshData.access_token);
              
              // 갱신된 토큰으로 원래 하려던 요청(재시도)
              console.log("[apiClient] 토큰 갱신 성공! 원래 요청 재시도...");
              finalOptions.headers['Authorization'] = `Bearer ${refreshData.access_token}`;
              
              const retryTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('요청 시간이 초과됐습니다.')), timeout)
              );
              const retryResp = await Promise.race([fetch(url, finalOptions), retryTimeoutPromise]);
              
              if (retryResp.ok) {
                return await retryResp.json();
              }
            } else {
              // 리프레시 토큰도 만료되었거나 올바르지 않은 경우 -> 자동 로그아웃 처리
              console.log("[apiClient] Refresh Token도 만료됨. 로그아웃 처리 필요.");
              await AsyncStorage.removeItem('access_token');
              await AsyncStorage.removeItem('refresh_token');
            }
          } catch (refreshErr) {
            console.error("[apiClient] 토큰 갱신 중 에러:", refreshErr);
          }
        }
      }

      // 위에서 재시도를 안 했거나 실패했다면 원래대로 에러 처리
      let errorMessage = `서버 응답 오류 (상태 코드: ${response.status})`;
      try {
        const errorData = await response.json();
        console.error(`[apiClient] ${endpoint} 상세 에러:`, JSON.stringify(errorData, null, 2));

        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n');
        } else if (errorData.detail && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
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
