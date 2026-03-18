import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const ReviewSelectRouteScreen = () => {
  const router = useRouter();

  const savedRoutes = [
    { id: 1, title: '2024 대전 여행', location: '대한민국 대전광역시', date: '2024.01.05' },
    { id: 2, title: '2022 제주도 여행', location: '대한민국 제주특별자치도', date: '2024.08.12' },
    { id: 3, title: '2022 강릉 여행', location: '대한민국 강릉시', date: '2022.03.05' },
    { id: 4, title: '2018 경주 여행', location: '대한민국 경주시', date: '2018.07.12' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/review')} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>후기를 작성할 경로를 선택하세요</Text>
        <View style={{ width: 24 }} />
      </View>

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

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {/* 🌟 에러의 원인이었던 주석을 완전히 제거했습니다! */}
        {savedRoutes.map((route) => (
          <TouchableOpacity key={route.id} style={styles.routeCard} activeOpacity={0.8} onPress={() => router.push('/review-write')}>
            
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>📄</Text> 
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.routeTitle}>{route.title}</Text>
              <Text style={styles.routeSubtitle}>📍 {route.location} | {route.date}</Text>
            </View>

          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} /> 
      </ScrollView>

    </SafeAreaView>
  );
};

// ==================================================
// 🎨 스타일시트
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    height: 60, 
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEF', 
  },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  
  folderSection: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  folderTag: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, backgroundColor: '#FFFFFF' },
  folderText: { fontSize: 14, color: '#333' },
  folderPlusBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, width: 40, alignItems: 'center', justifyContent: 'center' },
  folderPlusText: { fontSize: 18, color: '#555' },

  listContainer: { paddingHorizontal: 20 },
  
  routeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#A0AAB5', 
    borderRadius: 24,           
    padding: 24, 
    marginBottom: 16 
  },
  iconBox: { marginRight: 16 },
  iconText: { fontSize: 28, color: '#FFF' }, 
  infoBox: { flex: 1 },
  
  routeTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  routeSubtitle: { fontSize: 13, color: '#F0F4F8' }, 
});

export default ReviewSelectRouteScreen;