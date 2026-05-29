
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import SearchIcon from '../components/icons/searchIcon';
import PencilIcon from '../components/icons/pencilIcon';
import HeartIcon from '../components/icons/heartIcon';
import ShareIcon from '../components/icons/shareIcon';
import { fetchReviews } from '../api/reviewApi';
import { BASE_URL } from '../api/apiClient';
import { useRoutes } from '../context/RouteContext';

const ReviewScreen = () => {
  const router = useRouter();
  const { likedReviews, toggleLikedReview } = useRoutes();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchReviews();
        setReviews(data || []);
      } catch (e) {
        console.error('[ReviewScreen] 후기 불러오기 실패:', e.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []));

  // 검색어 기반 필터링
  const filteredReviews = reviews.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.preview_comment?.toLowerCase().includes(q) ||
      r.region?.toLowerCase().includes(q)
    );
  });

  const handleShare = async (review) => {
    const lines = [];
    if (review.title) lines.push(review.title);
    if (review.region) lines.push(`📍 ${review.region}`);
    if (review.preview_comment) lines.push(review.preview_comment);
    lines.push(`\nGONYADI 앱에서 보기 👉 gonyadi://review-detail?id=${review.review_pk}&type=db`);
    try {
      await Share.share({ message: lines.join('\n') });
    } catch (e) {
      Alert.alert('공유 실패', e.message);
    }
  };

  // 연관 검색어 (title, region 기반)
  const allKeywords = Array.from(new Set(
    reviews.flatMap(r => [r.title, r.region].filter(Boolean))
  ));
  const suggestedKeywords = searchQuery.trim() === ''
    ? []
    : allKeywords.filter(k => k.includes(searchQuery)).slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.headerSection}>
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <SearchIcon width={20} height={20} color="#333" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="검색어(여행지, 장소 등)를 입력하세요"
            placeholderTextColor="#7F94A1"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {isFocused && suggestedKeywords.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestedKeywords.map((keyword, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => { setSearchQuery(keyword); setIsFocused(false); }}
              >
                <SearchIcon width={14} height={14} color="#888" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText}>{keyword}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.subTitle}>다른 여행자들의 후기를 탐색하세요</Text>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#43B0AB" />
          </View>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <TouchableOpacity
              key={review.review_pk}
              style={styles.reviewCard}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/review-detail', params: { id: review.review_pk, type: 'db' } })}
            >
              <View style={styles.imageSection}>
                {review.thumbnail ? (
                  <Image
                    source={{ uri: review.thumbnail }}
                    style={styles.imagePlaceholder}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
              </View>

              <View style={styles.cardInfoRow}>
                <View style={styles.userInfo}>
                  {/* 프로필 이미지 서버 데이터 연동 */}
                  {review.author_profile_image ? (
                    <Image
                      source={{
                        uri: review.author_profile_image.startsWith('http')
                          ? review.author_profile_image
                          : `${BASE_URL}${review.author_profile_image}`,
                      }}
                      style={styles.userAvatar}
                    />
                  ) : (
                    <View style={styles.userAvatarPlaceholder}>
                      <Text style={styles.userAvatarText}>{review.author?.substring(0, 1) || '유'}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.userName}>{review.author || '익명 사용자'}</Text>
                    <Text style={styles.postDate}>{review.created_at ? review.created_at.substring(0, 10).replace(/-/g, '년 ').replace('년 ', '년 ').replace(' ', '') + '일' : '2025년 8월 12일'}</Text>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(review)}>
                    <ShareIcon width={24} height={24} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { paddingRight: 0 }]} onPress={() => toggleLikedReview(review.review_pk)}>
                    <HeartIcon isFilled={!!likedReviews[review.review_pk]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.textSection}>
                <Text style={styles.reviewTitle} numberOfLines={1}>{review.title}</Text>
                <Text style={styles.reviewContent} numberOfLines={2}>{review.preview_comment}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? '검색 결과가 없습니다.' : '아직 작성된 후기가 없습니다.\n첫 번째 후기를 남겨보세요!'}
            </Text>
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fabBtn} activeOpacity={0.8} onPress={() => router.push('/review-select-route')}>
        <PencilIcon width={28} height={28} color="#FFFFFF" />
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, backgroundColor: '#FFFFFF', zIndex: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCFFE8', borderWidth: 1, borderColor: '#DCE5B6', borderRadius: 24, height: 48, paddingHorizontal: 16, marginBottom: 10 },
  searchBarFocused: { borderColor: '#A9E2D9', backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  clearBtn: { padding: 4 },
  clearBtnText: { color: '#999', fontSize: 16 },

  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  suggestionText: { fontSize: 15, color: '#333' },

  subTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: 10, marginTop: 10 },
  listContainer: { paddingHorizontal: 20 },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8ECEF', // 조금 더 부드러운 테두리
    overflow: 'hidden',
    paddingBottom: 8, // 하단 여백 추가
  },
  imageSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180, // 높이를 조금 줄여 시원한 비율
    backgroundColor: '#EAF3FA',
    borderRadius: 16,
  },
  
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userAvatarText: { color: '#888', fontSize: 12 },
  userName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  postDate: { fontSize: 11, color: '#999', marginTop: 2 },
  
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: { padding: 8, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },

  textSection: { paddingHorizontal: 20, paddingBottom: 20 },
  reviewTitle: { fontSize: 17, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  reviewContent: { fontSize: 14, color: '#666', lineHeight: 20 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15, textAlign: 'center', lineHeight: 24 },

  fabBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 64,
    height: 64,
    backgroundColor: '#43B0AB',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});

export default ReviewScreen;
