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
  const folders = ['국내', '해외']; // 폴더 생성 기능을 제외하므로 고정된 리스트 사용

  // 🌟 2. 전역 Context에서 데이터 가져오기!!
  const { allRoutes, toggleFavorite } = useRoutes();

  // 🌟 3. 현재 탭에 맞는 데이터만 필터링 및 즐겨찾기 정렬
  const filteredRoutes = allRoutes
    .filter(route => route.category === activeTab)
    .sort((a, b) => {
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
        {folders.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📍 선택할 경로 리스트 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredRoutes.length > 0 ? (
          filteredRoutes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.routeCard}
              onPress={() => router.push('/review-write')} // 누르면 후기 작성 화면으로!
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
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>해당 폴더에 저장된 경로가 없습니다.</Text>
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
  tabButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#C4CCD8', marginRight: 10, backgroundColor: '#FFF' },
  activeTabButton: { backgroundColor: '#F4FAD3', borderColor: '#DCE5B6' },
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

  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
});

export default ReviewSelectScreen;