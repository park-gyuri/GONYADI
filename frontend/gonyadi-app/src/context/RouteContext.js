import React, { createContext, useState, useContext, useEffect } from 'react';
import { getFolders, getMyRoutes } from '../api/routeApi';

const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);

  // 저장된 경로 (서버에서 불러오기 전엔 빈 상태)
  const [allRoutes, setAllRoutes] = useState([]);

  // 작성된 리뷰 목록 (초기에는 빈 상태)
  const [reviews, setReviews] = useState([]);

  const loadRouteData = async () => {
    try {
      const [serverFolders, serverRoutes] = await Promise.all([
        getFolders(),
        getMyRoutes()
      ]);
      
      if (serverFolders && serverFolders.length > 0) {
        setFolders(serverFolders);
      }

      if (serverRoutes && serverRoutes.length > 0) {
        // 서버 데이터를 앱 UI 형식에 맞춰 변환
        const formattedRoutes = serverRoutes.map(r => ({
          id: r.itinerary_pk,
          category: r.folder_name || '국내', // 서버 응답에 따라 조정
          title: r.title,
          location: r.region,
          date: r.created_at || new Date().toISOString().split('T')[0],
          days: r.days,
          isFavorite: false,
          recommendation_data: r.recommendation_data
        }));
        setAllRoutes(formattedRoutes);
      } else {
        setAllRoutes([]);
      }
    } catch (error) {
      console.error('초기 데이터 로딩 실패:', error);
    }
  };

  // 🌟 앱 구동 시 서버에서 데이터 가져오기
  useEffect(() => {
    loadRouteData();
  }, []);

  const clearRouteData = () => {
    setFolders([]);
    setAllRoutes([]);
    setReviews([]);
  };

  const toggleFavorite = (id) => {
    setAllRoutes(prev => prev.map(route => 
      route.id === id ? { ...route, isFavorite: !route.isFavorite } : route
    ));
  };

  const addFolder = async (name) => {
    try {
      const { createFolder } = require('../api/routeApi');
      const newFolderData = await createFolder({ name });
      if (newFolderData && newFolderData.folder_pk) {
        setFolders(prev => [...prev, newFolderData]);
      } else {
        setFolders(prev => [...prev, { folder_pk: Date.now(), name }]);
      }
    } catch (error) {
      console.error('폴더 생성 실패:', error);
      setFolders(prev => [...prev, { folder_pk: Date.now(), name }]);
    }
  };

  const updateFolder = async (folderId, newName) => {
    try {
      const { updateFolderApi } = require('../api/routeApi');
      await updateFolderApi(folderId, newName);
      setFolders(prev => prev.map(f => f.folder_pk === folderId ? { ...f, name: newName } : f));
      
      // 관련 경로 카테고리 이름도 일괄 업데이트 (선택 사항)
      setAllRoutes(prev => prev.map(r => r.category === prev.find(f=>f.folder_pk===folderId)?.name ? { ...r, category: newName } : r));
    } catch (error) {
      console.error('폴더 이름 수정 실패:', error);
      throw error;
    }
  };

  const deleteFolder = async (folderId) => {
    try {
      const { deleteFolderApi } = require('../api/routeApi');
      await deleteFolderApi(folderId);
      setFolders(prev => prev.filter(f => f.folder_pk !== folderId));
      // 경로도 삭제된다면 여기서 allRoutes에서 제거 필요
    } catch (error) {
      console.error('폴더 삭제 실패:', error);
      throw error;
    }
  };

  const addReview = (review) => {
    setReviews(prev => [review, ...prev]);
  };

  return (
    <RouteContext.Provider value={{ folders, allRoutes, setAllRoutes, toggleFavorite, addFolder, updateFolder, deleteFolder, reviews, addReview, loadRouteData, clearRouteData }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoutes = () => useContext(RouteContext);
