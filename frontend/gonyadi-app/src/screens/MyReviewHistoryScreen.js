import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRoutes } from '../context/RouteContext';

const MyReviewHistoryScreen = () => {
  const router = useRouter();
  const { reviews } = useRoutes();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* 1. 상단 타이틀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/my')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>작성한 후기 내역</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <TouchableOpacity
              key={review.id}
              style={styles.reviewCard}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/review-detail', params: { id: review.id, type: 'db', from: '/my-review-history' } })}
            >
              <View style={styles.imageSection}>
                {review.thumbnail ? (
                  <Image source={{ uri: review.thumbnail }} style={styles.imagePlaceholder} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
              </View>

              <View style={styles.textSection}>
                <Text style={styles.reviewTitle} numberOfLines={1}>{review.title}</Text>
                <Text style={styles.reviewContent} numberOfLines={2}>{review.content}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
            <Text style={{ color: '#999' }}>작성한 후기가 없습니다.</Text>
          </View>
        )}

        {/* 하단 여백 */}
        <View style={{ height: 120 }} />
      </ScrollView>

    </SafeAreaView>
  );
};

// ==================================================
// 🎨 스타일시트
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // 헤더 스타일
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF',
    backgroundColor: '#FFFFFF',
    zIndex: 10
  },
  backButton: { padding: 8, width: 40, alignItems: 'center' },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  listContainer: { paddingHorizontal: 20, paddingTop: 20 },

  // 리뷰 카드 스타일 (ReviewScreen.js와 통일)
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C4CCD8',
    overflow: 'hidden',
  },
  imageSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  textSection: {
    padding: 20,
    paddingTop: 16,
  },
  reviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  reviewContent: { fontSize: 13, color: '#666', lineHeight: 18 },
});


export default MyReviewHistoryScreen;
