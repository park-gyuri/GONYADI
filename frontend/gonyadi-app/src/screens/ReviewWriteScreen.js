import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DownloadIcon from '../components/icons/downloadIcon';
import MarkerIcon from '../components/icons/markerIcon';
import StarIcon from '../components/icons/starIcon';
import ReviewSaveModal from '../components/ReviewSaveModal';
import { useRoutes } from '../context/RouteContext';
import { createReview, updateReview as updateReviewApi } from '../api/reviewApi';

const ReviewWriteScreen = () => {
  const router = useRouter();
  const { id, editMode, reviewId, editTitle, editRatings, editComments, editPhotos, editThumbnailPlaceId } = useLocalSearchParams();
  const { allRoutes, addReview, updateReviewInContext } = useRoutes();

  const isEditMode = editMode === 'true';

  const selectedRoute = allRoutes.find(r => String(r.id) === String(id));

  // 일차별 일정 구성 (schedule 형식 우선, 없으면 flat places를 days로 분배)
  const finalSchedule = useMemo(() => {
    const recData = selectedRoute?.recommendation_data || {};
    const totalDays = selectedRoute?.days || 1;

    if (recData.schedule && recData.schedule.length > 0) {
      let gi = 0;
      return recData.schedule.map(d => ({
        day: d.day,
        places: d.places.map(p => ({ ...p, _gi: gi++ })),
      }));
    }

    const flatPlaces = recData.places || [];
    if (flatPlaces.length === 0) return [];

    const perDay = Math.ceil(flatPlaces.length / totalDays);
    const schedule = [];
    for (let day = 1; day <= totalDays; day++) {
      const start = (day - 1) * perDay;
      const end = Math.min(start + perDay, flatPlaces.length);
      if (start < flatPlaces.length) {
        schedule.push({
          day,
          places: flatPlaces.slice(start, end).map((p, i) => ({ ...p, _gi: start + i })),
        });
      }
    }
    return schedule;
  }, [selectedRoute]);

  const [selectedDay, setSelectedDay] = useState(1);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [photos, setPhotos] = useState({});
  const [mainTitle, setMainTitle] = useState('');
  const [thumbnailPlaceId, setThumbnailPlaceId] = useState(null);
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      // 수정 모드: 기존 데이터로 초기화
      setMainTitle(editTitle || '');
      try { setRatings(JSON.parse(editRatings || '{}')); } catch { setRatings({}); }
      try { setComments(JSON.parse(editComments || '{}')); } catch { setComments({}); }
      try { setPhotos(JSON.parse(editPhotos || '{}')); } catch { setPhotos({}); }
      setThumbnailPlaceId(editThumbnailPlaceId || null);
    } else {
      // 새 작성 모드
      setRatings({});
      setComments({});
      setPhotos({});
      setMainTitle(selectedRoute?.title ? `${selectedRoute.title} 후기` : '');
      setThumbnailPlaceId(null);
    }
    setSelectedDay(finalSchedule[0]?.day || 1);
  }, [id, selectedRoute?.title, isEditMode]);

  const currentDayPlaces = finalSchedule.find(d => d.day === selectedDay)?.places || [];

  const handleSave = async () => {
    if (!mainTitle.trim()) {
      Alert.alert('안내', '제목을 입력해주세요.');
      return;
    }
    const hasAnyRating = Object.values(ratings).some(r => r > 0);
    if (!hasAnyRating) {
      Alert.alert('안내', '장소 하나 이상에 꼭 별점을 남겨주세요.');
      setSaveModalVisible(false);
      return;
    }

    try {
      if (isEditMode && reviewId) {
        // 수정 모드
        const response = await updateReviewApi(reviewId, {
          title: mainTitle,
          ratings,
          comments,
          photos,
          thumbnail_place_id: thumbnailPlaceId,
        });

        updateReviewInContext(Number(reviewId), {
          title: mainTitle,
          content: Object.values(comments).find(c => c) || '내용 없음',
          thumbnail: thumbnailPlaceId && photos[thumbnailPlaceId]?.[0]
            ? photos[thumbnailPlaceId][0]
            : Object.values(photos).flat()[0] || null,
        });

        Alert.alert('완료', '후기가 수정되었습니다.', [
          {
            text: '확인', onPress: () => {
              setSaveModalVisible(false);
              router.replace({ pathname: '/review-detail', params: { id: reviewId, type: 'db', from: '/my-review-history' } });
            }
          }
        ]);
      } else {
        // 새 작성 모드
        const response = await createReview({
          itinerary_id: Number(id),
          title: mainTitle,
          ratings,
          comments,
          photos,
          thumbnail_place_id: thumbnailPlaceId,
        });

        addReview({
          id: response.review_pk || Date.now(),
          routeId: response.itinerary_id || id,
          title: mainTitle,
          content: Object.values(comments)[0] || '내용 없음',
          thumbnail: thumbnailPlaceId && photos[thumbnailPlaceId]?.[0]
            ? photos[thumbnailPlaceId][0]
            : Object.values(photos)[0]?.[0] || null,
        });

        setSaveModalVisible(false);
        router.replace('/review');
      }
    } catch (e) {
      console.error('[ReviewWrite] 저장 실패:', e.message);
      if (!isEditMode) {
        // 새 작성 Fallback
        addReview({
          id: Date.now(),
          routeId: id,
          title: mainTitle,
          content: Object.values(comments)[0] || '내용 없음',
          thumbnail: Object.values(photos)[0]?.[0] || null,
        });
        setSaveModalVisible(false);
        router.replace('/review');
      } else {
        Alert.alert('오류', '수정에 실패했습니다: ' + e.message);
        setSaveModalVisible(false);
      }
    }
  };

  const handleRating = (placeId, score) => setRatings(prev => ({ ...prev, [placeId]: score }));
  const handleCommentChange = (placeId, text) => setComments(prev => ({ ...prev, [placeId]: text }));

  // 사진 삭제
  const removePhoto = (placeId, photoIndex) => {
    setPhotos(prev => {
      const updated = { ...prev };
      const list = [...(updated[placeId] || [])];
      list.splice(photoIndex, 1);
      if (list.length === 0) {
        delete updated[placeId];
        // 대표가 이 장소였으면 해제
        if (thumbnailPlaceId === placeId) setThumbnailPlaceId(null);
      } else {
        updated[placeId] = list;
      }
      return updated;
    });
  };

  // 대표 사진 토글
  const toggleThumbnail = (placeId, photoIndex) => {
    if (thumbnailPlaceId === placeId && photoIndex === 0) {
      setThumbnailPlaceId(null);
    } else {
      setPhotos(prev => {
        const updated = { ...prev };
        const list = [...(updated[placeId] || [])];
        if (list.length > photoIndex) {
          const selectedPhoto = list.splice(photoIndex, 1)[0];
          list.unshift(selectedPhoto);
          updated[placeId] = list;
        }
        return updated;
      });
      setThumbnailPlaceId(placeId);
    }
  };

  const pickImage = async (placeId) => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('권한 필요', '사진을 첨부하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(asset => asset.uri);
      setPhotos(prev => ({ ...prev, [placeId]: [...(prev[placeId] || []), ...newUris] }));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => isEditMode ? router.back() : router.push('/review-select-route')} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? '후기 수정하기' : '후기를 작성하세요'}</Text>
        <TouchableOpacity style={styles.saveIconBtn} onPress={() => setSaveModalVisible(true)}>
          <DownloadIcon width={28} height={28} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* 제목 입력 */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>[제목 작성]</Text>
        </View>
        <View style={styles.mainTitleContainer}>
          <TextInput
            style={styles.mainTitleInput}
            placeholder="제목을 입력하세요."
            placeholderTextColor="#888"
            value={mainTitle}
            onChangeText={setMainTitle}
          />
        </View>

        {/* 일차 탭 */}
        {finalSchedule.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabScroll} contentContainerStyle={styles.dayTabContainer}>
            {finalSchedule.map(d => (
              <TouchableOpacity
                key={d.day}
                style={[styles.dayTab, selectedDay === d.day && styles.dayTabActive]}
                onPress={() => setSelectedDay(d.day)}
              >
                <Text style={[styles.dayTabText, selectedDay === d.day && styles.dayTabTextActive]}>
                  {d.day}일차
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 선택된 일차의 장소 목록 */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>[후기 작성]</Text>
        </View>
        <View style={styles.listContainer}>
          {currentDayPlaces.map((item, index) => {
            const isLast = index === currentDayPlaces.length - 1;
            const placeId = item.id || `place_${item._gi ?? index}`;
            const currentRating = ratings[placeId] || 0;
            const placePhotos = photos[placeId] || [];
            const isThumbnailPlace = thumbnailPlaceId === placeId;

            return (
              <View key={placeId} style={styles.rowContainer}>
                <View style={[styles.contentRight, isLast && styles.contentRightLast]}>
                  <View style={styles.placeHeader}>
                    <MarkerIcon width={24} height={24} style={{ marginRight: 8 }} />
                    <Text style={styles.placeName}>{item.name}</Text>
                    <View style={styles.starContainer}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <TouchableOpacity key={star} onPress={() => handleRating(placeId, star)}>
                          <StarIcon size={18} isFilled={star <= currentRating} color="#43B0AB" style={{ marginRight: 2 }} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.reviewInputBox}>
                    <TextInput
                      style={styles.reviewInput}
                      placeholder="내용을 입력하세요"
                      placeholderTextColor="#888"
                      multiline
                      value={comments[placeId] || ''}
                      onChangeText={text => handleCommentChange(placeId, text)}
                    />
                  </View>

                  {placePhotos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                      {placePhotos.map((uri, idx) => (
                        <View key={idx} style={styles.photoWrapper}>
                          {/* 대표 버튼 (왼쪽 상단) */}
                          <TouchableOpacity
                            style={[
                              styles.thumbnailBadge,
                              isThumbnailPlace && idx === 0 && styles.thumbnailBadgeActive
                            ]}
                            onPress={() => toggleThumbnail(placeId, idx)}
                          >
                            <Text style={[
                              styles.thumbnailBadgeText,
                              isThumbnailPlace && idx === 0 && styles.thumbnailBadgeTextActive
                            ]}>대표</Text>
                          </TouchableOpacity>

                          {/* X 삭제 버튼 (오른쪽 상단) */}
                          <TouchableOpacity
                            style={styles.photoDeleteBtn}
                            onPress={() => removePhoto(placeId, idx)}
                          >
                            <Text style={styles.photoDeleteBtnText}>✕</Text>
                          </TouchableOpacity>

                          <Image source={{ uri }} style={styles.attachedPhoto} resizeMode="contain" />
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  <TouchableOpacity style={styles.addImageBtn} activeOpacity={0.7} onPress={() => pickImage(placeId)}>
                    <Text style={styles.addImageText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <ReviewSaveModal
        visible={isSaveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: '#E8ECEF' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  saveIconBtn: { padding: 8 },

  scrollArea: { flex: 1 },

  mainTitleContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4CCD8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  mainTitleInput: { fontSize: 16, fontWeight: 'bold', color: '#111' },

  dayTabScroll: { marginBottom: 16 },
  dayTabContainer: { paddingHorizontal: 10, gap: 8, flexDirection: 'row' },
  dayTab: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#C4CCD8', backgroundColor: '#F8F9FA' },
  dayTabActive: { backgroundColor: '#43B0AB', borderColor: '#43B0AB' },
  dayTabText: { fontSize: 14, color: '#888', fontWeight: '600' },
  dayTabTextActive: { color: '#FFFFFF' },

  sectionTitleContainer: { paddingHorizontal: 16, marginTop: 10, marginBottom: 5 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#43B0AB' },

  listContainer: { paddingHorizontal: 10 },
  rowContainer: { flexDirection: 'row' },

  contentRight: { flex: 1, paddingLeft: 6, paddingBottom: 30 },
  contentRightLast: { paddingBottom: 0 },

  placeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 8 },
  placeName: { fontSize: 18, fontWeight: 'bold', color: '#111', flexShrink: 1 },
  starContainer: { flexDirection: 'row' },

  reviewInputBox: {
    backgroundColor: '#FCFFE8',
    borderRadius: 12,
    padding: 16,
    height: 100,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE5B6',
  },
  reviewInput: { fontSize: 14, color: '#333', textAlignVertical: 'top', height: '100%' },

  photoScroll: { flexDirection: 'row', marginBottom: 12 },
  photoWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  attachedPhoto: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
  },

  // X 삭제 버튼
  photoDeleteBtn: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.74)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  photoDeleteBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

  // 대표 버튼
  thumbnailBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: '#CCC',
    zIndex: 10,
  },
  thumbnailBadgeActive: {
    backgroundColor: '#43B0AB',
    borderColor: '#43B0AB',
  },
  thumbnailBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  thumbnailBadgeTextActive: { color: '#FFFFFF' },

  addImageBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: '#A0AAB5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', marginBottom: 12 },
  addImageText: { fontSize: 32, color: '#888', fontWeight: '300' },
});

export default ReviewWriteScreen;
