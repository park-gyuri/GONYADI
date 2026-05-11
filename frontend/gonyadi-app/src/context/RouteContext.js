import React, { createContext, useState, useContext, useEffect } from 'react';
import { getFolders, getMyRoutes } from '../api/routeApi';

import { mockRouteResultBusan, mockRouteResultDaegu, mockRouteResultDaejeon, mockRouteResultMungyeong, mockRouteResultOsaka, mockRouteResultSapporo, mockRouteResultJeju, mockRouteResultPhuQuoc } from '../data/dummyData';

const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);

  // 저장된 경로 (서버에서 불러오기 전엔 빈 상태)
  const [allRoutes, setAllRoutes] = useState([]);

  // 작성된 리뷰 목록 (초기에는 빈 상태)
  const [reviews, setReviews] = useState([]);

  // 🌟 앱 구동 시 서버에서 데이터 가져오기
  useEffect(() => {
    const initData = async () => {
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
          
          setAllRoutes(prev => {
            const newRoutes = formattedRoutes.filter(fr => !prev.some(pr => pr.id === fr.id));
            return [...newRoutes, ...prev];
          });
        }
      } catch (error) {
        console.error('초기 데이터 로딩 실패:', error);
      }
    };
    initData();
  }, []);

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
        // 백엔드 응답이 예상과 다를 경우 로컬로 추가
        setFolders(prev => [...prev, { folder_pk: Date.now(), name }]);
      }
    } catch (error) {
      console.error('폴더 생성 실패:', error);
      // 오프라인이거나 서버 에러일 때도 UI에서는 추가되도록 fallback
      setFolders(prev => [...prev, { folder_pk: Date.now(), name }]);
    }
  };

  const addReview = (review) => {
    setReviews(prev => [review, ...prev]);
  };

  return (
    <RouteContext.Provider value={{ folders, allRoutes, setAllRoutes, toggleFavorite, addFolder, reviews, addReview }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoutes = () => useContext(RouteContext);
