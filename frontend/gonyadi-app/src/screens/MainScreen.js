import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import SearchIcon from '../components/icons/searchIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTopLikedReviews } from '../api/reviewApi';
import { getFullImageUrl, apiClient } from '../api/apiClient';

const MainScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const CITIES = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '제주', '경주', '전주', '여수', '강릉', '속초', '춘천', '수원', '포항', '통영', '거제', '안동', '목포', '순천', '군산', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '평창', '가평', '남해', '보령', '태안', '담양', '하동'];
  const filteredCities = searchQuery.trim() === '' ? [] : CITIES.filter(city => city.includes(searchQuery.trim()));

  const [topReviews, setTopReviews] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);

  // 사용자 정보 및 유저별 검색 기록 로드
  useEffect(() => {
    const loadUserAndHistory = async () => {
      let currentUserId = 'guest';
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          const profile = await apiClient('/api/v1/auth/me');
          if (profile && profile.user_id) {
            currentUserId = profile.user_id;
            setUserId(currentUserId);
          }
        }
      } catch (e) {
        console.log('사용자 정보 로드 실패 (게스트로 간주)');
      }

      try {
        const storedHistory = await AsyncStorage.getItem(`search_history_${currentUserId}`);
        if (storedHistory) {
          setSearchHistory(JSON.parse(storedHistory));
        } else {
          setSearchHistory([]);
        }
      } catch (e) {
        console.error('검색 기록 로드 실패', e);
      }
    };
    loadUserAndHistory();
  }, []);

  useFocusEffect(useCallback(() => {
    const loadTop = async () => {
      setLoadingTop(true);
      try {
        const data = await fetchTopLikedReviews();
        setTopReviews(data || []);
      } catch (e) {
        console.error('인기 여행지 로드 실패', e);
      } finally {
        setLoadingTop(false);
      }
    };
    loadTop();
  }, []));

  const saveHistoryToStorage = async (newHistory, currentUserId) => {
    try {
      const storageKey = `search_history_${currentUserId || 'guest'}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newHistory));
    } catch (e) {
      console.error('검색 기록 저장 실패', e);
    }
  };

  const navigateToRecommend = (keyword = searchQuery) => {
    setShowSuggestions(false);
    if (keyword.trim() !== '') {
      const newHistory = [keyword.trim(), ...searchHistory.filter(item => item !== keyword.trim())].slice(0, 50);
      setSearchHistory(newHistory);
      saveHistoryToStorage(newHistory, userId);
      router.push({ pathname: '/recommend', params: { destination: keyword.trim() } });
    } else {
      router.push('/recommend');
    }
  };

  const removeHistoryItem = (keyword) => {
    const newHistory = searchHistory.filter(item => item !== keyword);
    setSearchHistory(newHistory);
    saveHistoryToStorage(newHistory, userId);
  };

  const getCardImage = (review) => {
    if (review.thumbnail) return { uri: getFullImageUrl(review.thumbnail) };
    const seed = encodeURIComponent(review.region || review.title || 'korea');
    return { uri: `https://picsum.photos/seed/${seed}/300/200` };
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
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onSubmitEditing={() => navigateToRecommend()}
            />
            <TouchableOpacity onPress={() => navigateToRecommend()} style={styles.searchIconBtn}>
              <SearchIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {showSuggestions && filteredCities.length > 0 && (
            <ScrollView style={styles.suggestionsWrapper} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
              {filteredCities.map((city, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearchQuery(city);
                    navigateToRecommend(city);
                  }}
                >
                  <SearchIcon width={14} height={14} style={{ marginRight: 8, opacity: 0.5 }} />
                  <Text style={styles.suggestionText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.searchHistoryTitle}>검색 내역</Text>
          <View style={styles.searchHistoryWrapper}>
            {searchHistory.length === 0 ? (
              <Text style={styles.emptyHistoryText}>검색한 내역이 없습니다.</Text>
            ) : (
              searchHistory.slice(0, 10).map((city, index) => (
                <View key={index} style={styles.historyBadge}>
                  <TouchableOpacity onPress={() => navigateToRecommend(city)} style={styles.badgeTextBtn}>
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

        {/* [섹션 B] 인기 여행지 — 하트 많이 받은 후기 기반 */}
        <View style={styles.recommendSection}>
          <Text style={styles.sectionTitle}>인기 여행지</Text>
          <Text style={styles.sectionSubtitle}>다른 여행자들이 좋아한 후기</Text>

          {loadingTop ? (
            <ActivityIndicator size="small" color="#43B0AB" style={{ marginTop: 20 }} />
          ) : topReviews.length === 0 ? (
            <Text style={styles.emptyText}>아직 인기 여행지가 없습니다.{'\n'}후기에 하트를 눌러 추천해보세요!</Text>
          ) : (
            <View style={styles.gridContainer}>
              {topReviews.map((review) => (
                <TouchableOpacity
                  key={review.review_pk}
                  style={styles.gridCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/review-detail', params: { id: review.review_pk, type: 'db' } })}
                >
                  <Image source={getCardImage(review)} style={styles.cardImage} />
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cityText} numberOfLines={1}>{review.region || '대한민국'}</Text>
                    <Text style={styles.cardTitle} numberOfLines={1}>{review.title}</Text>
                    <View style={styles.likeRow}>
                      <Text style={styles.heartIcon}>♥</Text>
                      <Text style={styles.likeCount}>{review.like_count}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    backgroundColor: '#C9ECE6',
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
    borderRadius: 30,
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
  suggestionsWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDE5DE',
    marginTop: -12,
    marginBottom: 20,
    paddingVertical: 8,
    maxHeight: 180,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  suggestionText: {
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
    gap: 6,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6DFD6',
  },
  badgeTextBtn: {
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 4,
  },
  historyBadgeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  deleteBadgeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  deleteBadgeText: {
    fontSize: 16,
    color: '#888',
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
    marginBottom: 4,
    color: '#111',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
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
    padding: 10,
  },
  cityText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111',
  },
  cardTitle: {
    fontSize: 11,
    color: '#555',
    marginTop: 2,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  heartIcon: {
    fontSize: 13,
    color: '#E05C5C',
  },
  likeCount: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
});

export default MainScreen;
