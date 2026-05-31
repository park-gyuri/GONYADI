
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import SearchIcon from '../components/icons/searchIcon';
import PencilIcon from '../components/icons/pencilIcon';
import HeartIcon from '../components/icons/heartIcon';
import ShareIcon from '../components/icons/shareIcon';
import { fetchReviews } from '../api/reviewApi';
import { BASE_URL, getFullImageUrl } from '../api/apiClient';
import { useRoutes } from '../context/RouteContext';

const ReviewAvatar = ({ uri, authorName }) => {
  const [error, setError] = useState(false);
  
  if (!uri || error) {
    return (
      <View style={styles.userAvatarPlaceholder}>
        <Text style={styles.userAvatarText}>{authorName?.substring(0, 1) || '유'}</Text>
      </View>
    );
  }
  
  return (
    <Image
      source={{ uri }}
      style={styles.userAvatar}
      onError={() => setError(true)}
    />
  );
};

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

  // 한글 초성 및 부분 매칭 정규식 생성기
  const createFuzzyRegex = (query) => {
    if (!query) return new RegExp('');
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cho = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    let pattern = '';
    
    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      const code = char.charCodeAt(0);
      
      // 완성형 한글인 경우
      if (code >= 44032 && code <= 55203) {
        // 종성이 없는 경우 (받침 없음) -> 가~깋 처럼 범위로 검색
        if ((code - 44032) % 28 === 0) {
          const endChar = String.fromCharCode(code + 27);
          pattern += `[${char}-${endChar}]`;
        } else {
          pattern += char;
        }
      } 
      // 자음(초성)인 경우
      else {
        const choIndex = cho.indexOf(char);
        if (choIndex !== -1) {
          const start = 44032 + (choIndex * 588);
          const end = start + 587;
          pattern += `[${char}${String.fromCharCode(start)}-${String.fromCharCode(end)}]`;
        } else {
          pattern += escapeRegExp(char);
        }
      }
    }
    return new RegExp(pattern, 'i');
  };

  const q = searchQuery.toLowerCase().replace(/\s+/g, '');
  const fuzzyRegex = createFuzzyRegex(q);

  // 연관 검색어 (region, places 기반)
  const allKeywords = Array.from(new Set(
    reviews.flatMap(r => [r.region, ...(r.places || [])].filter(Boolean))
  ));

  const suggestedKeywords = searchQuery.trim() === ''
    ? []
    : allKeywords.filter(k => {
        const kLower = k.toLowerCase().replace(/\s+/g, '');
        return fuzzyRegex.test(kLower);
      }).sort((a, b) => {
        const aLower = a.toLowerCase().replace(/\s+/g, '');
        const bLower = b.toLowerCase().replace(/\s+/g, '');

        // 정확히 일치하는 단어를 초성 매칭보다 우선
        const aExact = aLower.includes(q);
        const bExact = bLower.includes(q);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 매칭되는 위치 찾기 (앞쪽일수록 우선순위 높음)
        const aMatch = aLower.match(fuzzyRegex);
        const bMatch = bLower.match(fuzzyRegex);
        const aIndex = aMatch ? aMatch.index : 999;
        const bIndex = bMatch ? bMatch.index : 999;
        
        if (aIndex !== bIndex) return aIndex - bIndex; // 0(시작 단어)일수록 상위 노출
        return a.length - b.length; // 매칭 위치가 같다면 글자 수가 짧은 것을 우선
      }).slice(0, 5);

  // 검색어 기반 필터링
  const filteredReviews = reviews.filter(r => {
    if (!searchQuery.trim()) return true;
    
    const titleStr = (r.title || "").toLowerCase().replace(/\s+/g, '');
    const regionStr = (r.region || "").toLowerCase().replace(/\s+/g, '');
    const previewStr = (r.preview_comment || "").toLowerCase().replace(/\s+/g, '');
    const placeStrs = (r.places || []).map(p => p.toLowerCase().replace(/\s+/g, ''));
    
    return (
      fuzzyRegex.test(titleStr) ||
      fuzzyRegex.test(regionStr) ||
      fuzzyRegex.test(previewStr) ||
      placeStrs.some(p => fuzzyRegex.test(p))
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
                    source={{ uri: getFullImageUrl(review.thumbnail) }}
                    style={styles.imagePlaceholder}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
              </View>

              <View style={styles.cardInfoRow}>
                <View style={styles.userInfo}>
                  {/* 프로필 이미지 서버 데이터 연동 (에러 처리 포함) */}
                  <ReviewAvatar 
                    uri={review.author_profile_image ? getFullImageUrl(review.author_profile_image) : null} 
                    authorName={review.author} 
                  />
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
