// src/screens/RouteScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // 🌟 이거 추가!

const RouteScreen = () => {
    const router = useRouter(); // 🌟 이거 추가!
  // 🌟 나중에 데이터베이스나 API에서 불러올 저장된 경로 데이터 예시!
  const savedRoutes = [
    { id: 1, title: '2024 대전 여행', location: '대한민국 대전광역시', date: '2024.01.05' },
    { id: 2, title: '2022 제주도 여행', location: '대한민국 제주특별자치도', date: '2024.08.12' },
    { id: 3, title: '2022 강릉 여행', location: '대한민국 강릉시', date: '2022.03.05' },
    { id: 4, title: '2018 경주 여행', location: '대한민국 경주시', date: '2018.07.12' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* 1. 상단 폴더 필터 영역 */}
      <View style={styles.folderSection}>
        <TouchableOpacity style={styles.folderTag}>
          <Text style={styles.folderText}>해외</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.folderTag}>
          <Text style={styles.folderText}>국내</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.folderPlusBtn}>
          <Text style={styles.folderPlusText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 2. 저장된 경로 카드 리스트 영역 */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {savedRoutes.map((route) => (
          <TouchableOpacity key={route.id}
          style={styles.routeCard} activeOpacity={0.7} onPress={() => router.push('/saved-route-detail')}>
            
            {/* 좌측 아이콘 (나중에 피그마 파일 아이콘 SVG로 교체하세요!) */}
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>📄</Text> 
            </View>

            {/* 우측 텍스트 정보 */}
            <View style={styles.infoBox}>
              <Text style={styles.routeTitle}>{route.title}</Text>
              <Text style={styles.routeSubtitle}>📍 {route.location} | {route.date}</Text>
            </View>

          </TouchableOpacity>
        ))}
        
        {/* 하단 탭바에 카드가 가려지지 않도록 넉넉한 여백 추가 */}
        <View style={{ height: 120 }} /> 
      </ScrollView>

    </SafeAreaView>
  );
};

// ==================================================
// 🎨 피그마 디자인 기반 스타일시트
// ==================================================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  
  // --- 상단 폴더 부분 ---
  folderSection: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 20 
  },
  folderTag: { 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    marginRight: 8, 
    backgroundColor: '#FFFFFF' 
  },
  folderText: { 
    fontSize: 14, 
    color: '#333' 
  },
  folderPlusBtn: { 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    width: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  folderPlusText: { 
    fontSize: 18, 
    color: '#555' 
  },

  // --- 경로 카드 리스트 부분 ---
  listContainer: { 
    paddingHorizontal: 20 
  },
  routeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0F6FA', // 🌟 피그마의 예쁜 연한 하늘색
    borderRadius: 24,           // 🌟 둥글둥글한 모서리
    padding: 24, 
    marginBottom: 16 
  },
  iconBox: { 
    marginRight: 16 
  },
  iconText: { 
    fontSize: 28 // 임시 이모티콘 크기
  },
  infoBox: { 
    flex: 1 
  },
  routeTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#111', 
    marginBottom: 6 
  },
  routeSubtitle: { 
    fontSize: 12, 
    color: '#8E9EAB' // 피그마의 회색 폰트 색상
  },
});

export default RouteScreen;