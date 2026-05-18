import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import SearchIcon from '../components/icons/searchIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';

const recommendedDestinations = [
  { id: 1, city: '경주', country: '대한민국', image: 'https://picsum.photos/seed/gyeongju/300/200' },
  { id: 2, city: '부산', country: '대한민국', image: 'https://picsum.photos/seed/busan/300/200' },
  { id: 3, city: '대전', country: '대한민국', image: 'https://picsum.photos/seed/daejeon/300/200' },
  { id: 4, city: '대구', country: '대한민국', image: 'https://picsum.photos/seed/daegu/300/200' },
  { id: 5, city: '울산', country: '대한민국', image: 'https://picsum.photos/seed/ulsan/300/200' },
  { id: 6, city: '여수', country: '대한민국', image: 'https://picsum.photos/seed/yeosu/300/200' },
];

const MainScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);

  React.useEffect(() => {
    const loadHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem('search_history');
        if (storedHistory) {
          setSearchHistory(JSON.parse(storedHistory));
        }
      } catch (e) {
        console.error('검색 기록 로드 실패', e);
      }
    };
    loadHistory();
  }, []);

  const saveHistoryToStorage = async (newHistory) => {
    try {
      await AsyncStorage.setItem('search_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('검색 기록 저장 실패', e);
    }
  };

  const navigateToRecommend = (keyword = searchQuery) => {
    if (keyword.trim() !== '') {
      // 검색 기록 추가 (중복 제거 및 맨 앞으로, 최대 15개)
      const newHistory = [keyword.trim(), ...searchHistory.filter(item => item !== keyword.trim())].slice(0, 15);
      setSearchHistory(newHistory);
      saveHistoryToStorage(newHistory);
      router.push({ pathname: '/recommend', params: { destination: keyword.trim() } });
    } else {
      router.push('/recommend');
    }
  };

  const removeHistoryItem = (keyword) => {
    const newHistory = searchHistory.filter(item => item !== keyword);
    setSearchHistory(newHistory);
    saveHistoryToStorage(newHistory);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MYROUTE</Text>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* [섹션 A] 여행 경로 추천 받기 검색 박스 */}
        <View style={styles.searchSection}>
          <Text style={styles.searchSectionTitle}>원하는 여행지를 입력하고 경로 추천받기</Text>

          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="여행지를 검색하세요"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => navigateToRecommend()}
            />
            <TouchableOpacity onPress={() => navigateToRecommend()} style={styles.searchIconBtn}>
              <SearchIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          <Text style={styles.searchHistoryTitle}>검색 내역</Text>
          <View style={styles.searchHistoryWrapper}>
            {searchHistory.length === 0 ? (
              <Text style={styles.emptyHistoryText}>검색한 내역이 없습니다.</Text>
            ) : (
              searchHistory.map((city, index) => (
                <View key={index} style={styles.historyBadge}>
                  <TouchableOpacity onPress={() => navigateToRecommend(city)}>
                    <Text style={styles.historyBadgeText}>{city}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeHistoryItem(city)} style={styles.deleteBadgeBtn}>
                    <Text style={styles.deleteBadgeText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* [섹션 B] 추천 여행지 (2열 세로 스크롤) */}
        <View style={styles.recommendSection}>
          <Text style={styles.sectionTitle}>추천 여행지</Text>

          <View style={styles.gridContainer}>
            {recommendedDestinations.map(dest => (
              <TouchableOpacity key={dest.id} style={styles.gridCard} activeOpacity={0.9}>
                <Image source={{ uri: dest.image }} style={styles.cardImage} />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.countryText}>{dest.country}</Text>
                  <Text style={styles.cityText}>{dest.city}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchSection: {
    backgroundColor: '#C9ECE6', // 피그마 스크린샷 연한 청록색 느낌
    borderRadius: 20,
    padding: 24,
    marginBottom: 25,
  },
  searchSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30, // 약간 더 트렌디한 알약 모양
    borderWidth: 1,
    borderColor: '#CDE5DE',
    height: 48,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  searchIconBtn: {
    padding: 4,
  },
  searchHistoryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  searchHistoryWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6DFD6',
  },
  historyBadgeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    marginRight: 6,
  },
  deleteBadgeBtn: {
    padding: 2,
  },
  deleteBadgeText: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  recommendSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#CCC',
  },
  cardTextContainer: {
    padding: 12,
  },
  countryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
  },
  cityText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
});

export default MainScreen;