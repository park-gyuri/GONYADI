import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DownloadIcon from '../components/icons/downloadIcon';
import MarkerIcon from '../components/icons/markerIcon';
import StarIcon from '../components/icons/starIcon';
import ReviewSaveModal from '../components/ReviewSaveModal';

const ReviewWriteScreen = () => {
  const router = useRouter();
  const [ratings, setRatings] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);

  const handleSave = () => {
    // 팝업이 사라지게만 처리
    setSaveModalVisible(false);
  };

  const places = [
    { id: 1, name: '장소A', transport: '도보 20분 이동' },
    { id: 2, name: '장소B', transport: '버스 20분 이동' },
    { id: 3, name: '장소C', transport: '도보 10분 이동' },
    { id: 4, name: '장소D', transport: null },
  ];

  const handleRating = (placeId, score) => {
    setRatings(prev => ({ ...prev, [placeId]: score }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/review-select-route')} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>후기를 작성하세요</Text>
        <TouchableOpacity style={styles.saveIconBtn} onPress={() => setSaveModalVisible(true)}>
          <DownloadIcon width={28} height={28} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <View style={styles.mainTitleContainer}>
          <TextInput
            style={styles.mainTitleInput}
            placeholder="제목을 입력하세요"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.listContainer}>
          {places.map((item, index) => {
            const isLastItem = index === places.length - 1;
            const currentRating = ratings[item.id];

            return (
              <View key={item.id} style={styles.rowContainer}>
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineLine} />
                </View>

                <View style={[styles.contentRight, isLastItem && styles.contentRightLast]}>
                  <View style={styles.placeHeader}>
                    <MarkerIcon width={24} height={24} style={{ marginRight: 8 }} />
                    <Text style={styles.placeName}>{item.name}</Text>
                    <View style={styles.starContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => handleRating(item.id, star)}>
                          <StarIcon 
                            size={18} 
                            isFilled={star <= currentRating} 
                            color="#43B0AB" 
                            style={{ marginRight: 2 }} 
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.reviewInputBox}>
                    <TextInput
                      style={styles.reviewInput}
                      placeholder="내용을 입력하세요"
                      placeholderTextColor="#888"
                      multiline={true}
                    />
                  </View>

                  <TouchableOpacity style={styles.addImageBtn} activeOpacity={0.7}>
                    <Text style={styles.addImageText}>+</Text>
                  </TouchableOpacity>

                  {item.transport ? (
                    <Text style={styles.transportText}>{item.transport}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* 🌟 수정 포인트: 스크롤 안쪽, 리스트가 끝난 바로 아래에 포인트 박스를 배치했습니다! */}
        <View style={styles.bottomStatusBox}>
          <Text style={styles.statusLabel}>후기 완성도</Text>
          <Text style={styles.statusValue}>0 % 완료</Text>
        </View>

        {/* 🌟 탭바에 가려지지 않게 스크롤 맨 밑에 여유 공간 확보 */}
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

// ==================================================
// 🎨 스타일시트
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: '#E8ECEF', zIndex: 10 },
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
    marginBottom: 20
  },
  mainTitleInput: { fontSize: 16, fontWeight: 'bold', color: '#111' },

  listContainer: { paddingHorizontal: 10 },
  rowContainer: { flexDirection: 'row' },

  // 📏 타임라인 스타일 (ReviewDetail과 통일)
  timelineLeft: { width: 5, alignItems: 'center' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#444' },

  contentRight: { flex: 1, paddingLeft: 10, paddingBottom: 30 },
  contentRightLast: { paddingBottom: 0 },

  placeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  placeName: { fontSize: 20, fontWeight: 'bold', color: '#111', marginRight: 15 },
  starContainer: { flexDirection: 'row' },

  reviewInputBox: { 
    backgroundColor: '#FCFFE8', 
    borderRadius: 12, 
    padding: 16, 
    height: 100, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE5B6'
  },
  reviewInput: { fontSize: 14, color: '#333', textAlignVertical: 'top', height: '100%' },

  addImageBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: '#A0AAB5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', marginBottom: 12 },
  addImageText: { fontSize: 32, color: '#888', fontWeight: '300' },

  transportText: { fontSize: 14, color: '#43B0AB', fontWeight: 'bold', marginTop: 4, marginBottom: 10 },

  bottomStatusBox: {
    flexDirection: 'row',
    backgroundColor: '#BCEBE3', // 디자인 사진에 맞춘 민트색
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    justifyContent: 'center', // 가운데로 더 모이게 수정
    alignItems: 'center',
    gap: 60, // 두 텍스트 사이의 간격
  },
  statusLabel: { fontSize: 16, color: '#555', fontWeight: '600' },
  statusValue: { fontSize: 22, fontWeight: 'bold', color: '#111' },
});

export default ReviewWriteScreen;