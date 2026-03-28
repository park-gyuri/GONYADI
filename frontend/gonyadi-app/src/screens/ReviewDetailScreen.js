import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MarkerIcon from '../components/icons/markerIcon';
import StarIcon from '../components/icons/starIcon';

const ReviewDetailScreen = () => {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);

  const reviewDetails = [
    { id: 1, name: '장소A', rating: 4, text: '창가 자리에 앉아 멍하니 풍경 보기 너무 좋아요. 커피 향도 진하고 디저트가 정말 예술입니다!', images: ['https://picsum.photos/id/43/200', 'https://picsum.photos/id/102/200'] },
    { id: 2, name: '장소B', rating: 5, text: '산책로 정비가 잘 되어 있어서 가볍게 걷기 딱이에요. 주말에 피크닉 오면 힐링 그 자체일 듯합니다.', images: ['https://picsum.photos/id/13/200'] },
    { id: 3, name: '장소C', rating: 3, text: '조용한 클래식 음악과 책 냄새 덕분에 마음이 편안해지네요. 구석구석 숨은 보물 같은 책들이 많아요.', images: ['https://picsum.photos/id/24/200'] },
    { id: 4, name: '장소D', rating: 5, text: '아기자기하고 귀여운 소품이 너무 많아서 눈이 즐거워요! 친구 선물 사러 왔다가 제 것만 잔뜩 사고 갑니다.', images: ['https://picsum.photos/id/96/200'] },
  ];

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 🔙 헤더 영역 (뒤로가기만 남김) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/review')} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {/* 🏷️ 후기 제목 (본문 최상단) */}
        <View style={styles.titleWrapper}>
          <Text style={styles.routeTitle}>
            [2박 3일 부산 여행] 해안도로 드라이브 여행
          </Text>
        </View>

        {reviewDetails.map((item, index) => {
          const isLastItem = index === reviewDetails.length - 1;

          return (
            <View key={item.id} style={styles.rowContainer}>
              {/* 📏 타임라인 왼쪽 선 */}
              <View style={styles.timelineLeft}>
                <View style={styles.timelineLine} />
              </View>

              <View style={[styles.contentRight, isLastItem && styles.contentRightLast]}>
                <View style={styles.placeHeader}>
                  <MarkerIcon width={24} height={24} style={{ marginRight: 8 }} />
                  <Text style={styles.placeName}>{item.name}</Text>
                  {renderStars(item.rating)}
                </View>

                <View style={styles.reviewTextBox}>
                  <Text style={styles.reviewText}>{item.text}</Text>
                </View>

                {item.images && item.images.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {item.images.map((imgUrl, imgIndex) => (
                      <TouchableOpacity 
                        key={imgIndex} 
                        activeOpacity={0.8}
                        onPress={() => setSelectedImage(imgUrl)}
                      >
                        <Image source={{ uri: imgUrl }} style={styles.thumbnailImage} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : null}
              </View>
            </View>
          );
        })}
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
              source={{ uri: selectedImage }} 
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    height: 60, 
    backgroundColor: '#FFFFFF', 
    zIndex: 10,
  },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  titleWrapper: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#C4CCD8', 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 15,
    marginBottom: 20,
    marginTop: 10
  },
  routeTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', textAlign: 'center' },

  listContainer: { paddingHorizontal: 10 },
  rowContainer: { flexDirection: 'row' },
  
  // 📏 타임라인 스타일 (좌측 공간 최소화)
  timelineLeft: { width: 5, alignItems: 'center' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#444' },

  contentRight: { flex: 1, paddingLeft: 10, paddingBottom: 40 },
  contentRightLast: { paddingBottom: 80 },

  placeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  placeName: { fontSize: 20, fontWeight: 'bold', color: '#111', marginRight: 15 },
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
  
  imageScroll: { flexDirection: 'row', marginBottom: 10 },
  thumbnailImage: { width: 90, height: 90, borderRadius: 12, marginRight: 10, backgroundColor: '#E0E0E0' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '90%', height: '70%' },
});

export default ReviewDetailScreen;