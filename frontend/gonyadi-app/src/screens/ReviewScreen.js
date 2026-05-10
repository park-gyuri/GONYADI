
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import SearchIcon from '../components/icons/searchIcon';
import PencilIcon from '../components/icons/pencilIcon';
import HeartIcon from '../components/icons/heartIcon';

// 가짜 데이터 가져오기 (삿포로, 오사카, 대구, 부산)
import { mockRouteResultSapporo, mockRouteResultOsaka, mockRouteResultDaegu, mockRouteResultBusan, mockRouteResultDaejeon, mockRouteResultMungyeong, mockRouteResultJeju, mockRouteResultPhuQuoc } from '../data/dummyData';
import { useRoutes } from '../context/RouteContext';

const ReviewScreen = () => {
  const router = useRouter();
  const { reviews } = useRoutes();
  const [likedReviews, setLikedReviews] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const toggleLike = (id) => {
    setLikedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 🌟 가짜 데이터와 실제 리뷰 데이터를 합쳐서 보여줍니다.
  const rawData = [
    mockRouteResultSapporo,
    mockRouteResultOsaka,
    mockRouteResultDaegu,
    mockRouteResultBusan,
    mockRouteResultDaejeon,
    mockRouteResultMungyeong,
    mockRouteResultJeju,
    mockRouteResultPhuQuoc,
    ...reviews.map(r => ({
      id: r.id,
      reviewSection: { mainTitle: r.title, allReviews: [{ comment: r.content }] },
      userInput: { destination: r.title }
    }))
  ];

  // 🌟 연관 검색어 수집
  const allKeywords = Array.from(new Set(
    rawData.flatMap(route => [
      route.userInput?.destination,
      ...(route.userInput?.tags || []),
      ...(route.schedule?.flatMap(day => day.places.map(p => p.name)) || []),
      ...(route.schedule?.flatMap(day => day.places.map(p => p.description)) || [])
    ]).filter(Boolean)
  ));

  const suggestedKeywords = searchQuery.trim() === ''
    ? []
    : allKeywords.filter(k => k.includes(searchQuery)).slice(0, 5);

  // 🌟 검색어 기반 리뷰 필터링 로직
  const filteredReviews = rawData.filter(route => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = route.reviewSection?.mainTitle?.toLowerCase().includes(query) || false;
    const destMatch = route.userInput?.destination?.toLowerCase().includes(query) || false;

    return titleMatch || destMatch;
  }).map(route => {
    const reviewWithPhoto = route.reviewSection?.allReviews?.find(r => r.photos && r.photos.length > 0);
    const thumbnail = reviewWithPhoto ? reviewWithPhoto.photos[0] : null;
    const previewContent = route.reviewSection?.allReviews?.[0]?.comment || "후기가 작성되지 않았습니다.";

    return {
      id: route.id,
      title: route.reviewSection?.mainTitle || route.userInput?.destination || '여행 후기',
      content: previewContent,
      thumbnail: thumbnail,
    };
  }).filter(review => review.content !== "후기가 작성되지 않았습니다.");

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* 상단 고정 헤더 영역 */}
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
            onBlur={() => {
              // 약간의 딜레이를 줘서 연관검색어 터치가 가능하게 함
              setTimeout(() => setIsFocused(false), 200);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 연관 검색어 드롭다운 */}
        {isFocused && suggestedKeywords.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestedKeywords.map((keyword, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => {
                  setSearchQuery(keyword);
                  setIsFocused(false);
                }}
              >
                <SearchIcon width={14} height={14} color="#888" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText}>{keyword}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.subTitle}>다른 여행자들의 후기를 탐색하세요</Text>
      </View>

      {/* 블로그 형태 후기 리스트 영역 */}
      <ScrollView style={styles.listContainer} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <TouchableOpacity key={review.id} style={styles.reviewCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/review-detail', params: { id: review.id } })}>
              <View style={styles.imageSection}>
                {review.thumbnail ? (
                  <Image source={typeof review.thumbnail === 'string' ? { uri: review.thumbnail } : review.thumbnail} style={styles.imagePlaceholder} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )}
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => toggleLike(review.id)}
                >
                  <HeartIcon isFilled={likedReviews[review.id]} />
                </TouchableOpacity>
              </View>
              <View style={styles.textSection}>
                <Text style={styles.reviewTitle} numberOfLines={1}>{review.title}</Text>
                <Text style={styles.reviewContent} numberOfLines={2}>{review.content}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          </View>
        )}

        {/* 플로팅 버튼에 가려지지 않게 여백을 넉넉히 추가 */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 우측 하단 연필 버튼 */}
      <TouchableOpacity style={styles.fabBtn} activeOpacity={0.8} onPress={() => router.push('/review-select-route')}>
        <PencilIcon width={28} height={28} color="#FFFFFF" />
      </TouchableOpacity>

    </SafeAreaView>
  );
};

// ==================================================
// 🎨 스타일시트
// ==================================================
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
    elevation: 3
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
    borderColor: '#C4CCD8',
    overflow: 'hidden'
  },
  imageSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    alignItems: 'center',
    position: 'relative'
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#EAF3FA',
    borderRadius: 16,
  },
  heartBtn: {
    position: 'absolute',
    top: 25,
    right: 25,
    zIndex: 11,
  },
  textSection: {
    padding: 20,
  },
  reviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  reviewContent: { fontSize: 13, color: '#666', lineHeight: 18 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },

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
    elevation: 8
  },
});


export default ReviewScreen;