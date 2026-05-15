import { apiClient } from './apiClient';

// 폴더 목록 가져오기
export const fetchFolders = async () => {
  try {
    const response = await apiClient('/api/v1/folders', { method: 'GET' });
    return response; // list of FolderResponse
  } catch (error) {
    console.error('[saveApi] 폴더 목록 조회 실패:', error);
    throw error;
  }
};

// 새 폴더 생성하기
export const createFolder = async (folderName) => {
  try {
    const response = await apiClient('/api/v1/folders', {
      method: 'POST',
      body: JSON.stringify({ name: folderName }),
    });
    return response;
  } catch (error) {
    console.error('[saveApi] 폴더 생성 실패:', error);
    throw error;
  }
};

// 일정 저장하기
export const saveItinerary = async (itineraryData) => {
  try {
    const response = await apiClient('/api/v1/itineraries', {
      method: 'POST',
      body: JSON.stringify(itineraryData),
    });
    return response;
  } catch (error) {
    console.error('[saveApi] 일정 저장 실패:', error);
    throw error;
  }
};

// 전체 일정 목록 가져오기
export const fetchAllItineraries = async () => {
  try {
    const response = await apiClient('/api/v1/itineraries', { method: 'GET' });
    return response;
  } catch (error) {
    console.error('[saveApi] 일정 목록 조회 실패:', error);
    throw error;
  }
};
