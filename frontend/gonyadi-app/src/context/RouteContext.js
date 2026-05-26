import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFolders, getMyRoutes } from '../api/routeApi';

const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);

  // 저장된 경로 (서버에서 불러오기 전엔 빈 상태)
  const [allRoutes, setAllRoutes] = useState([]);

  // 작성된 리뷰 목록
  const [reviews, setReviews] = useState([]);

  // 좋아요 누른 리뷰 목록 (전역 상태) { reviewId: boolean }
  const [likedReviews, setLikedReviews] = useState({});

  // 앱 시작 시 AsyncStorage에서 찜 데이터 복원
  useEffect(() => {
    const loadLiked = async () => {
      try {
        const saved = await AsyncStorage.getItem('liked_reviews');
        if (saved) setLikedReviews(JSON.parse(saved));
      } catch (e) {
        console.error('찜 데이터 로드 실패:', e);
      }
    };
    loadLiked();
  }, []);

  const loadRouteData = async () => {
    try {
      const { apiClient } = require('../api/apiClient');
      const { fetchReviews } = require('../api/reviewApi');

      // 1. 서버 데이터 병렬 호출
      const [serverFolders, serverRoutes, allServerReviews, userProfile] = await Promise.all([
        getFolders(),
        getMyRoutes(),
        fetchReviews().catch(() => []),
        apiClient('/api/v1/auth/me').catch(() => null)
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

      // 내 리뷰 필터링 및 셋팅
      if (allServerReviews && userProfile) {
        const myReviews = allServerReviews.filter(r => r.user_id === userProfile.user_id || r.author === userProfile.user_nickname);
        // 포맷을 기존 앱 구조에 맞게 (필요 시) 변환
        const formattedMyReviews = myReviews.map(r => ({
          id: r.review_pk,
          routeId: r.itinerary_id,
          title: r.title,
          content: r.preview_comment || '내용이 없습니다.',
          thumbnail: r.thumbnail
        }));
        setReviews(formattedMyReviews);
      } else {
        setReviews([]);
      }

    } catch (error) {
      console.error('초기 데이터 로딩 실패:', error);
    }
  };

  // 🌟 앱 구동 시 로그인된 경우에만 서버에서 데이터 가져오기
  useEffect(() => {
    const loadIfAuthenticated = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        loadRouteData();
      }
    };
    loadIfAuthenticated();
  }, []);

  const clearRouteData = async () => {
    setFolders([]);
    setAllRoutes([]);
    setReviews([]);
    setLikedReviews({});
    try {
      await AsyncStorage.removeItem('liked_reviews');
    } catch (e) {
      console.error('찜 데이터 삭제 실패:', e);
    }
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

  const deleteReviewFromContext = (reviewId) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  const updateReviewInContext = (reviewId, updatedData) => {
    setReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, ...updatedData } : r
    ));
  };

  const toggleLikedReview = async (reviewId) => {
    const isCurrentlyLiked = !!likedReviews[reviewId];
    const updated = { ...likedReviews, [reviewId]: !isCurrentlyLiked };
    if (!updated[reviewId]) delete updated[reviewId];
    setLikedReviews(updated);
    try {
      await AsyncStorage.setItem('liked_reviews', JSON.stringify(updated));
      const { likeReview, unlikeReview } = require('../api/reviewApi');
      if (isCurrentlyLiked) {
        await unlikeReview(reviewId);
      } else {
        await likeReview(reviewId);
      }
    } catch (e) {
      console.error('찜 데이터 저장 실패:', e);
    }
  };

  return (
    <RouteContext.Provider value={{ 
      folders, allRoutes, setAllRoutes, toggleFavorite, addFolder, updateFolder, deleteFolder, 
      reviews, addReview, setReviews, deleteReviewFromContext, updateReviewInContext,
      likedReviews, toggleLikedReview,
      loadRouteData, clearRouteData 
    }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoutes = () => useContext(RouteContext);
