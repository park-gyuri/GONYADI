
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Alert, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MarkerIcon from '../components/icons/markerIcon';
import StarIcon from '../components/icons/starIcon';
import ReviewupdateIcon from '../components/icons/reviewupdateIcon';
import { useRoutes } from '../context/RouteContext';
import { fetchReviewById, deleteReview as deleteReviewApi } from '../api/reviewApi';
import { getFullImageUrl } from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { mockRouteResultBusan, mockRouteResultDaegu, mockRouteResultDaejeon, mockRouteResultMungyeong, mockRouteResultOsaka, mockRouteResultSapporo, mockRouteResultJeju, mockRouteResultPhuQuoc } from '../data/dummyData';

const ALL_MOCK_DATA = [
  mockRouteResultBusan, mockRouteResultDaegu, mockRouteResultDaejeon, mockRouteResultMungyeong,
  mockRouteResultJeju, mockRouteResultOsaka, mockRouteResultSapporo, mockRouteResultPhuQuoc,
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ReviewDetailScreen = () => {
  const router = useRouter();
  const { id, type, from } = useLocalSearchParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [allModalPhotos, setAllModalPhotos] = useState([]);
  const [isDeleted, setIsDeleted] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyReview, setIsMyReview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [rawReviewData, setRawReviewData] = useState(null);
  const { reviews, allRoutes, deleteReviewFromContext } = useRoutes();

  const handleBack = () => {
    if (from) {
      router.push(from);
    } else {
      router.push('/review');
    }
  };

  // 본인 리뷰인지 확인
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const { apiClient } = require('../api/apiClient');
        const profile = await apiClient('/api/v1/auth/me').catch(() => null);
        if (profile && rawReviewData && rawReviewData.user_id === profile.user_id) {
          setIsMyReview(true);
        }
      } catch (e) {
        // 무시
      }
    };
    if (type === 'db' && rawReviewData) {
      checkOwnership();
    }
  }, [rawReviewData, type]);

  const handleDelete = () => {
    Alert.alert(
      '후기 삭제',
      '정말로 이 후기를 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleted(true); // 페치 방지
              await deleteReviewApi(id);
              deleteReviewFromContext(Number(id));
              Alert.alert('완료', '후기가 삭제되었습니다.', [
                { text: '확인', onPress: () => handleBack() }
              ]);
            } catch (e) {
              setIsDeleted(false);
              Alert.alert('오류', '삭제에 실패했습니다: ' + e.message);
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (!rawReviewData) return;
    router.push({
      pathname: '/review-write',
      params: {
        id: rawReviewData.itinerary_id,
        editMode: 'true',
        reviewId: String(rawReviewData.review_pk),
        editTitle: rawReviewData.title || '',
        editRatings: JSON.stringify(rawReviewData.ratings || {}),
        editComments: JSON.stringify(rawReviewData.comments || {}),
        editPhotos: JSON.stringify(rawReviewData.photos || {}),
        editThumbnailPlaceId: rawReviewData.thumbnail_place_id || '',
      }
    });
  };

  useEffect(() => {
    if (!id || isDeleted) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        if (type === 'db') {
          const dbReview = await fetchReviewById(id);
          if (dbReview) {
            setRawReviewData(dbReview);
            const recData = dbReview.recommendation_data || {};
            const totalDays = dbReview.days || 1;

            let finalSchedule = [];

            if (recData.schedule && recData.schedule.length > 0) {
              let globalIndex = 0;
              finalSchedule = recData.schedule.map(dayData => ({
                day: dayData.day,
                places: dayData.places.map(p => ({ ...p, _gi: globalIndex++ })),
              }));
            } else if (recData.places && recData.places.length > 0) {
              const flatPlaces = recData.places;
              const perDay = Math.ceil(flatPlaces.length / totalDays);
              for (let day = 1; day <= totalDays; day++) {
                const start = (day - 1) * perDay;
                const end = Math.min(start + perDay, flatPlaces.length);
                if (start < flatPlaces.length) {
                  finalSchedule.push({
                    day,
                    places: flatPlaces.slice(start, end).map((p, i) => ({ ...p, _gi: start + i })),
                  });
                }
              }
            }

            const allReviews = finalSchedule.flatMap(d =>
              d.places.map(place => {
                const placeId = place.id || `place_${place._gi}`;
                return {
                  placeId,
                  placeName: place.name,
                  rating: dbReview.ratings?.[placeId] || 0,
                  comment: dbReview.comments?.[placeId] || null,
                  photos: dbReview.photos?.[placeId] || [],
                };
              })
            );

            setRouteData({
              reviewSection: { mainTitle: dbReview.title, allReviews },
              schedule: finalSchedule,
            });
          }
          return;
        }

        // 더미 데이터에서 찾기
        const foundMock = ALL_MOCK_DATA.find(mock => String(mock.id) === String(id));
        if (foundMock) {
          setRouteData(foundMock);
          return;
        }

        // 로컬 리뷰에서 찾기 (RouteContext)
        const foundReview = reviews.find(r => String(r.id) === String(id));
        if (foundReview) {
          const foundRoute = allRoutes.find(r => String(r.id) === String(foundReview.routeId));
          const allPlaces = foundRoute?.recommendation_data?.schedule?.flatMap(s => s.places)
            || foundRoute?.recommendation_data?.places || [];
          setRouteData({
            ...foundRoute,
            reviewSection: {
              mainTitle: foundReview.title,
              allReviews: allPlaces.map((place, index) => {
                const placeId = place.id || `place_${index}`;
                return {
                  placeId,
                  comment: foundReview.comments?.[placeId] || null,
                  rating: foundReview.ratings?.[placeId] || 0,
                  photos: foundReview.photos?.[placeId] || [],
                };
              }),
            },
            schedule: foundRoute?.recommendation_data?.schedule || [],
          });
        }
      } catch (e) {
        console.error('[ReviewDetail] 불러오기 실패:', e.message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, type, reviews, allRoutes]);

  const renderStars = (rating) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} size={18} isFilled={star <= rating} color="#43B0AB" style={{ marginRight: 2 }} />
      ))}
    </View>
  );

  // 사진 전체보기 모달 열기 (해당 장소의 사진 목록 + 클릭한 인덱스)
  const openImageViewer = (photos, index) => {
    setAllModalPhotos(photos);
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
    setAllModalPhotos([]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#43B0AB" />
        </View>
      </SafeAreaView>
    );
  }

  if (!routeData || !routeData.reviewSection) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999' }}>후기 데이터를 불러올 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const reviewTitle = routeData.reviewSection.mainTitle || '리뷰 상세';
  const scheduleDays = routeData.schedule ? routeData.schedule.map(s => s.day) : [];

  // selectedDay 가 현재 schedule에 없으면 첫 번째 day로 보정
  const effectiveDay = scheduleDays.includes(selectedDay) ? selectedDay : (scheduleDays[0] ?? 1);

  let displayedReviews = [];
  if (routeData.schedule && routeData.schedule.length > 0) {
    const daySchedule = routeData.schedule.find(s => s.day === effectiveDay);
    if (daySchedule) {
      displayedReviews = daySchedule.places.map((place, index) => {
        const placeId = place.id || `place_${place._gi ?? index}`;
        const review = routeData.reviewSection.allReviews?.find(r =>
          String(r.placeId) === String(placeId) || r.placeName === place.name
        );
        return {
          placeId,
          placeName: place.name,
          rating: review?.rating ?? 0,
          comment: review?.comment ?? null,
          photos: review?.photos ?? [],
        };
      });
    }
  } else {
    displayedReviews = routeData.reviewSection.allReviews || [];
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {/* 수정/삭제 버튼 직접 노출 (마이페이지의 내가 작성한 후기 내역에서만 보임) */}
        {rawReviewData && from === '/my-review-history' && (
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{ padding: 8 }}>
            <ReviewupdateIcon width={24} height={24} color="#111" />
          </TouchableOpacity>
        )}
      </View>

      {/* 드롭다운 메뉴 (바깥 영역 클릭 시 닫힘) */}
      {showMenu && (
        <TouchableOpacity 
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 90 }} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleEdit}>
              <Text style={styles.dropdownText}>✏️  수정하기</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowMenu(false); handleDelete(); }}>
              <Text style={[styles.dropdownText, { color: '#E74C3C' }]}>🗑️  삭제하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}



      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.titleWrapper}>
          <Text style={styles.routeTitle}>{reviewTitle}</Text>
        </View>

        {scheduleDays.length > 0 && (
          <View style={styles.dayTabRow}>
            {scheduleDays.map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, effectiveDay === day && styles.dayTabActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayTabText, effectiveDay === day && styles.dayTabTextActive]}>{day}일차</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.timelineContainer}>
          <View style={styles.mainVerticalLine} />
          <View style={{ flex: 1 }}>
            {displayedReviews.length > 0 ? (
              displayedReviews.map((item, index) => (
                <View key={item.placeId || index} style={styles.placeItemWrapper}>
                  <View style={styles.placeCard}>
                    <View style={styles.placeHeader}>
                      <View style={styles.placeNameRow}>
                        <MarkerIcon width={24} height={24} color="#111" style={{ marginRight: 8 }} />
                        <Text style={styles.placeName}>{item.placeName}</Text>
                      </View>
                      {renderStars(item.rating ?? 0)}
                    </View>

                    {item.comment ? (
                      <View style={styles.reviewTextBox}>
                        <Text style={styles.reviewText}>{item.comment}</Text>
                      </View>
                    ) : null}

                    {item.photos && item.photos.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                        {item.photos.map((imgUrl, imgIndex) => (
                          <TouchableOpacity key={imgIndex} activeOpacity={0.8} onPress={() => openImageViewer(item.photos, imgIndex)}>
                            <Image
                              source={typeof imgUrl === 'string' ? { uri: getFullImageUrl(imgUrl) } : imgUrl}
                              style={styles.thumbnailImage}
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#888' }}>해당 일차에는 작성된 후기가 없습니다.</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 사진 전체보기 모달 (스와이프 지원) */}
      <Modal visible={selectedImageIndex !== null} transparent animationType="fade" onRequestClose={closeImageViewer}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={closeImageViewer}>
            <Text style={styles.modalCloseBtnText}>✕</Text>
          </TouchableOpacity>

          {allModalPhotos.length > 0 && (
            <>
              <FlatList
                data={allModalPhotos}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={selectedImageIndex || 0}
                getItemLayout={(_, index) => ({
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                keyExtractor={(_, index) => String(index)}
                renderItem={({ item }) => (
                  <View style={{ width: SCREEN_WIDTH, justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={typeof item === 'string' ? { uri: getFullImageUrl(item) } : item}
                      style={styles.fullScreenImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                  setSelectedImageIndex(newIndex);
                }}
              />
              {/* 페이지 인디케이터 */}
              {allModalPhotos.length > 1 && (
                <View style={styles.pageIndicator}>
                  {allModalPhotos.map((_, idx) => (
                    <View key={idx} style={[styles.dot, idx === selectedImageIndex && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#F5F7FA',
    zIndex: 10,
  },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  menuButton: { padding: 8 },
  menuIcon: { fontSize: 24, fontWeight: 'bold', color: '#111' },

  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
    minWidth: 150,
  },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 18 },
  dropdownDivider: { height: 1, backgroundColor: '#F0F0F0' },
  dropdownText: { fontSize: 15, color: '#333', fontWeight: '500' },

  titleWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4CCD8',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    marginTop: 10,
  },
  routeTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', textAlign: 'center' },
  listContainer: { paddingHorizontal: 20 },

  dayTabRow: { flexDirection: 'row', marginBottom: 20 },
  dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginRight: 10 },
  dayTabActive: { backgroundColor: '#FFFFFF', borderColor: '#DDD' },
  dayTabText: { fontSize: 14, color: '#999' },
  dayTabTextActive: { color: '#000', fontWeight: 'bold' },

  timelineContainer: { flexDirection: 'row', position: 'relative' },
  mainVerticalLine: { position: 'absolute', left: 20, top: 35, bottom: 50, width: 2, backgroundColor: '#C4CCD8', zIndex: -1 },

  placeItemWrapper: { marginBottom: 20 },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  placeHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, gap: 8 },
  placeNameRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 8 },
  placeName: { fontSize: 20, fontWeight: 'bold', color: '#111', flexShrink: 1 },
  starContainer: { flexDirection: 'row' },

  reviewTextBox: {
    backgroundColor: '#FCFFE8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE5B6',
  },
  reviewText: { fontSize: 14, color: '#333', lineHeight: 22 },

  imageScroll: { flexDirection: 'row' },
  thumbnailImage: { width: 90, height: 90, borderRadius: 12, marginRight: 10, backgroundColor: '#E0E0E0' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)', justifyContent: 'center', alignItems: 'center' },
  modalCloseBtn: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 10 },
  modalCloseBtnText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  fullScreenImage: { width: SCREEN_WIDTH * 0.9, height: '70%' },

  pageIndicator: { flexDirection: 'row', position: 'absolute', bottom: 60, alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#FFFFFF' },
});

export default ReviewDetailScreen;
