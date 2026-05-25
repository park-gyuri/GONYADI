import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FileIcon from '../components/icons/fileIcon';
import GrayMarkerIcon from '../components/icons/graymarkerIcon';
import StarIcon from '../components/icons/starIcon';
import { useRoutes } from '../context/RouteContext';

const ReviewSelectScreen = () => {
  const router = useRouter();

  // 🌟 1. 현재 어떤 폴더(탭)가 선택되었는지 기억하는 상태 (기본값: 국내)
  const [activeTab, setActiveTab] = useState('국내');

  // 🌟 2. 전역 Context에서 데이터 가져오기!!
  const { folders, allRoutes, toggleFavorite, reviews } = useRoutes();

  // 리뷰가 쓰여진 경로 ID 목록 수집
  const reviewedRouteIds = reviews.map(r => String(r.routeId));

  // 🌟 3. 현재 탭에 맞는 데이터만 필터링 및 정렬 (리뷰 쓴 건 맨 아래, 그 다음 즐겨찾기)
  const filteredRoutes = allRoutes
    .filter(route => route.category === activeTab)
    .sort((a, b) => {
      const aReviewed = reviewedRouteIds.includes(String(a.id));
      const bReviewed = reviewedRouteIds.includes(String(b.id));
      
      if (aReviewed && !bReviewed) return 1; // a가 리뷰를 썼으면 뒤로
      if (!aReviewed && bReviewed) return -1; // b가 리뷰를 썼으면 뒤로

      if (a.isFavorite === b.isFavorite) return 0;
      return a.isFavorite ? -1 : 1;
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/review')} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>후기를 작성할 경로를 선택하세요</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 📂 상단 폴더 탭 영역 */}
      <View style={styles.tabContainer}>
        {folders.map((folder) => (
          <TouchableOpacity
            key={folder.folder_pk}
            style={[
              styles.tabButton,
              activeTab === folder.name && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(folder.name)}
          >
            <Text style={[
              styles.tabText,
              activeTab === folder.name && styles.activeTabText
            ]}>
              {folder.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📍 선택할 경로 리스트 */}
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {filteredRoutes.length > 0 ? (
          filteredRoutes.map((route) => {
            const isReviewed = reviewedRouteIds.includes(String(route.id));
            
            return (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard, 
                  isReviewed && { opacity: 0.5, backgroundColor: '#F0F0F0' } // 후기를 쓴 경우 회색처리
                ]}
                onPress={() => {
                  if (isReviewed) {
                    Alert.alert('안내', '이미 후기를 작성한 경로입니다.');
                  } else {
                    router.push({ pathname: '/review-write', params: { id: route.id } });
                  }
                }}
              >
                <View style={styles.iconBox}>
                  <FileIcon width={24} height={24} />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeTitle}>{route.title}</Text>
                  <View style={styles.routeDetailsRow}>
                    <GrayMarkerIcon width={14} height={14} style={{ marginRight: 4 }} />
                    <Text style={styles.routeDetails}>{route.location} | {route.date}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(route.id)}>
                  <StarIcon isFilled={route.isFavorite} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>저장된 경로가 없습니다.</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },

  // 탭 스타일
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, alignItems: 'center' },
  tabButton: { height: 32, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#C4CCD8', marginRight: 10, backgroundColor: '#FFF' },
  activeTabButton: { backgroundColor: '#E0F2F1', borderColor: '#1ABC9C' },
  tabText: { fontSize: 14, color: '#555' },
  activeTabText: { color: '#111', fontWeight: 'bold' },

  // 리스트 카드 스타일 (스크린샷처럼 살짝 어두운 배경 적용) -> RouteScreen 스타일 통일
  content: { flex: 1, paddingHorizontal: 20 },
  routeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#C4CCD8' },
  iconBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  routeInfo: { flex: 1 },
  routeTitle: { fontSize: 17, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  routeDetailsRow: { flexDirection: 'row', alignItems: 'center' },
  routeDetails: { fontSize: 13, color: '#888' },
  favoriteBtn: { padding: 8, paddingRight: 0 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
});

export default ReviewSelectScreen;