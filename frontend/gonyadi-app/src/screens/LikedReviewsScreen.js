import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useRoutes } from '../context/RouteContext';
import { fetchReviews } from '../api/reviewApi';

const LikedReviewsScreen = () => {
  const router = useRouter();
  const { likedReviews } = useRoutes();
  const [allReviews, setAllReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchReviews();
        setAllReviews(data || []);
      } catch (e) {
        console.error('좋아요 후기 불러오기 실패:', e.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []));

  // 전역 상태에 좋아요 표시된 항목만 필터링
  const myLikedReviews = allReviews.filter(r => likedReviews[r.review_pk]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. 상단 타이틀 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/my')}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>찜한 리뷰 내역</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#43B0AB" />
          </View>
        ) : myLikedReviews.length > 0 ? (
          myLikedReviews.map((review) => (
            <TouchableOpacity
              key={review.review_pk}
              style={styles.reviewCard}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/review-detail', params: { id: review.review_pk, type: 'db', from: '/liked-reviews' } })}
            >
              <View style={styles.imageSection}>
                {review.thumbnail ? (
                  <Image source={{ uri: review.thumbnail }} style={styles.imagePlaceholder} />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
              </View>

              <View style={styles.textSection}>
                <View style={styles.titleRow}>
                  <Text style={styles.reviewTitle} numberOfLines={1}>{review.title}</Text>
                </View>
                <Text style={styles.reviewContent} numberOfLines={2}>{review.preview_comment}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>찜한 리뷰가 없습니다.</Text>
          </View>
        )}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#111', marginRight: 10 },
  updateIconBtn: { padding: 4 },
  reviewContent: { fontSize: 13, color: '#666', lineHeight: 18 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 150 },
  emptyText: { color: '#999', fontSize: 15, textAlign: 'center' },
});


export default LikedReviewsScreen;
