import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const ReviewScreen = () => {
  const router = useRouter(); // 🌟 이거 한 줄 추가!
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
          <Text style={styles.searchIcon}>🔍</Text>
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
        <Text style={styles.fabIcon}>✏️</Text>
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
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F1FA', borderRadius: 24, height: 48, paddingHorizontal: 16, marginBottom: 20 },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  subTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: 10 },
  listContainer: { paddingHorizontal: 20 },

  // 박스 in 박스 스타일
  reviewCard: {
    backgroundColor: '#E1F1FA', 
    borderRadius: 24,           
    marginBottom: 20,
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
    backgroundColor: '#D1D5DB', 
    borderRadius: 16,    
  },
  textSection: {
    padding: 20, 
  },
  reviewTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  reviewContent: { fontSize: 13, color: '#666', lineHeight: 18 },

  // 🌟 [수정된 부분] 플로팅 액션 버튼 (탭바 뒤에서 구출!)
  fabBtn: { 
    position: 'absolute', 
    bottom: 100, // 🌟 기존 20에서 90으로 대폭 올려서 탭바 위로 띄웠습니다!
    right: 20, 
    width: 64, 
    height: 64, 
    backgroundColor: '#8E9EAB', 
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