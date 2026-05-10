
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MarkerIcon from '../components/icons/markerIcon';
import StarIcon from '../components/icons/starIcon';
import { useRoutes } from '../context/RouteContext';

import { mockRouteResultBusan, mockRouteResultDaegu, mockRouteResultDaejeon, mockRouteResultMungyeong, mockRouteResultOsaka, mockRouteResultSapporo, mockRouteResultJeju, mockRouteResultPhuQuoc } from '../data/dummyData';

const ReviewDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const { reviews, allRoutes } = useRoutes();

  useEffect(() => {
    if (id) {
      // 🌟 1. 먼저 가짜 데이터(더미)에서 찾아보기
      const allMockData = [
        mockRouteResultBusan, mockRouteResultDaegu, mockRouteResultDaejeon, mockRouteResultMungyeong,
        mockRouteResultJeju, mockRouteResultOsaka, mockRouteResultSapporo, mockRouteResultPhuQuoc
      ];
      
      const foundMock = allMockData.find(mock => String(mock.id) === String(id));
      
      if (foundMock) {
        setRouteData(foundMock);
        return;
      }

      // 2. 가짜 데이터가 없으면 작성된 리뷰 목록에서 찾기
      const foundReview = reviews.find(r => String(r.id) === String(id));
      
      if (foundReview) {
        // 리뷰가 연결된 원본 경로 정보 찾기
        const foundRoute = allRoutes.find(r => String(r.id) === String(foundReview.routeId));
        
        // 상세 화면 렌더링을 위한 데이터 조합
        const allPlaces = foundRoute?.recommendation_data?.schedule?.flatMap(s => s.places) || foundRoute?.recommendation_data?.places || [];
        
        setRouteData({
          ...foundRoute,
          reviewSection: {
            mainTitle: foundReview.title,
            allReviews: allPlaces.map((place, index) => {
              const placeId = place.id || `place_${index}`;
              return {
                placeId: placeId,
                comment: foundReview.comments?.[placeId] || null,
                rating: foundReview.ratings?.[placeId] || 0,
                photos: foundReview.photos?.[placeId] || []
              };
            })
          },
          schedule: foundRoute?.recommendation_data?.schedule || []
        });
      }
    }
  }, [id, reviews, allRoutes]);

  const renderStars = (rating) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            size={18}
            isFilled={star <= rating}
            color="#43B0AB"
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  // 데이터가 로드되기 전이나 매칭되는 데이터가 없을 때
  if (!routeData || !routeData.reviewSection) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/review')} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999' }}>후기 데이터를 불러올 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const reviewTitle = routeData.reviewSection.mainTitle || "리뷰 상세";
  const scheduleDays = routeData.schedule ? routeData.schedule.map(s => s.day) : [];

  let displayedReviews = [];
  if (routeData.schedule && routeData.schedule.length > 0) {
    const daySchedule = routeData.schedule.find(s => s.day === selectedDay);
    if (daySchedule) {
      displayedReviews = daySchedule.places.map((place, index) => {
        const placeId = place.id || `place_${index}`;
        const review = routeData.reviewSection.allReviews?.find(r => 
          String(r.placeId) === String(placeId) || 
          r.placeName === place.name
        );
        return {
          placeId: placeId,
          placeName: place.name,
          rating: review ? review.rating : 0,
          comment: review ? review.comment : null,
          photos: review ? review.photos : []
        };
      }); // 리뷰나 사진이 없는 장소도 모두 보여주기 위해 filter 제거
    }
  } else {
    displayedReviews = routeData.reviewSection.allReviews || [];
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 🔙 헤더 영역 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/review')} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {/* 🏷️ 후기 제목 (본문 최상단) */}
        <View style={styles.titleWrapper}>
          <Text style={styles.routeTitle}>
            {reviewTitle}
          </Text>
        </View>

        {/* 📅 일차 선택 탭 (다중 일차인 경우에만 표시) */}
        {scheduleDays.length > 1 && (
          <View style={styles.dayTabRow}>
            {scheduleDays.map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, selectedDay === day && styles.dayTabActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayTabText, selectedDay === day && styles.dayTabTextActive]}>{day}일차</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.timelineContainer}>
          <View style={styles.mainVerticalLine} />

          <View style={{ flex: 1 }}>
            {displayedReviews.length > 0 ? (
              displayedReviews.map((item, index) => {
                return (
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
                            <TouchableOpacity
                              key={imgIndex}
                              activeOpacity={0.8}
                              onPress={() => setSelectedImage(imgUrl)}
                            >
                              <Image source={typeof imgUrl === 'string' ? { uri: imgUrl } : imgUrl} style={styles.thumbnailImage} />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : null}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#888' }}>해당 일차에는 작성된 후기가 없습니다.</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedImage(null)}>
          {selectedImage ? (
            <Image
              source={typeof selectedImage === 'string' ? { uri: selectedImage } : selectedImage}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : null}
        </TouchableOpacity>
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
  titleWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4CCD8',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    marginTop: 10
  },
  routeTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', textAlign: 'center' },

  listContainer: { paddingHorizontal: 20 },

  // 📅 일차 선택 탭 스타일
  dayTabRow: { flexDirection: 'row', marginBottom: 20 },
  dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginRight: 10 },
  dayTabActive: { backgroundColor: '#FFFFFF', borderColor: '#DDD' },
  dayTabText: { fontSize: 14, color: '#999' },
  dayTabTextActive: { color: '#000', fontWeight: 'bold' },

  // 📏 전체를 관통하는 수직 타임라인 선
  timelineContainer: { flexDirection: 'row', position: 'relative' },
  mainVerticalLine: { position: 'absolute', left: 20, top: 35, bottom: 50, width: 2, backgroundColor: '#C4CCD8', zIndex: -1 },

  placeItemWrapper: { marginBottom: 20 },

  // 프리미엄 장소 카드 (하나의 박스)
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
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
    borderColor: '#DCE5B6'
  },
  reviewText: { fontSize: 14, color: '#333', lineHeight: 22 },

  imageScroll: { flexDirection: 'row' },
  thumbnailImage: { width: 90, height: 90, borderRadius: 12, marginRight: 10, backgroundColor: '#E0E0E0' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '90%', height: '70%' },
});

export default ReviewDetailScreen;