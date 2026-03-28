import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import SearchIcon from '../components/icons/searchIcon';
import PencilIcon from '../components/icons/pencilIcon';
import HeartIcon from '../components/icons/heartIcon';

const ReviewScreen = () => {
  const router = useRouter();
  const [likedReviews, setLikedReviews] = React.useState({});

  const toggleLike = (id) => {
    setLikedReviews(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const reviews = [
    { id: 1, title: '[2박 3일 부산 여행] 해안도로 드라이브 여행', content: '부산까지 자차로 운전하면서 갔어요:) 바다를 보며 드라이브하니 기분이 너무 좋았고 경치가 너무 좋...' },
    { id: 2, title: '[2박 3일 부산 여행] 해안도로 드라이브 여행', content: '부산까지 자차로 운전하면서 갔어요:) 바다를 보며 드라이브하니 기분이 너무 좋았고 경치가 너무 좋...' },
    { id: 3, title: '[2박 3일 부산 여행] 해안도로 드라이브 여행', content: '부산까지 자차로 운전하면서 갔어요:) 바다를 보며 드라이브하니 기분이 너무 좋았고 경치가 너무 좋...' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* 상단 고정 헤더 영역 */}
      <View style={styles.headerSection}>
        <View style={styles.searchBar}>
          <SearchIcon width={20} height={20} color="#333" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Hinted search text"
            placeholderTextColor="#7F94A1"
          />
        </View>
        <Text style={styles.subTitle}>다른 여행자들의 후기를 탐색하세요</Text>
      </View>

      {/* 블로그 형태 후기 리스트 영역 */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {reviews.map((review) => (
          <TouchableOpacity key={review.id} style={styles.reviewCard} activeOpacity={0.9} onPress={() => router.push('/review-detail')}>

            <View style={styles.imageSection}>
              <View style={styles.imagePlaceholder} />
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
        ))}

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
  headerSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, backgroundColor: '#FFFFFF', zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCFFE8', borderWidth: 1, borderColor: '#DCE5B6', borderRadius: 24, height: 48, paddingHorizontal: 16, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  subTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: 10 },
  listContainer: { paddingHorizontal: 20 },

  // 박스 in 박스 스타일
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C4CCD8'
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
  fabIcon: { fontSize: 24, color: '#FFF' },
});

export default ReviewScreen;