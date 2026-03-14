// src/screens/MyScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* 1. 상단 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        
        {/* 2. 상단 프로필 카드 영역 */}
        <View style={styles.profileCard}>
          <View style={styles.avatar} />
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>김재은</Text>
            <Text style={styles.profilePoints}>포인트 0P</Text>
          </View>

          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* 3. 활동 통계 영역 (저장된 경로 & 작성한 후기) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>저장된 경로</Text>
          </View>
          
          <View style={[styles.statCard, { marginLeft: 16 }]}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>작성한 후기</Text>
          </View>
        </View>

        {/* 4. 환경설정 영역 */}
        <View style={styles.settingsSection}>
          
          {/* 환경설정 타이틀 */}
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderIcon}>⚙️</Text>
            <Text style={styles.settingsTitle}>환경설정</Text>
          </View>

          {/* 설정 메뉴 박스 */}
          <View style={styles.settingsBox}>
            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.6}>
              <Text style={styles.settingsItemText}>계정설정</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.6}>
              <Text style={styles.settingsItemText}>알림설정</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.settingsItem, { marginBottom: 0 }]} activeOpacity={0.6}>
              <Text style={styles.settingsItemText}>로그아웃</Text>
            </TouchableOpacity>
          </View>

        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

    </SafeAreaView>
  );
};

// ==================================================
// 🎨 스타일시트
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // 헤더
  header: { 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E8ECEF',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  scrollArea: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  // 프로필 카드
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EBF4FA', // 연한 하늘색 배경
    borderRadius: 24, 
    padding: 24,
    marginBottom: 16,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#5A738E', // 진한 남색/회색 아바타 배경
    marginRight: 20,
  },
  profileInfo: { flex: 1, justifyContent: 'center' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  profilePoints: { fontSize: 14, color: '#333', fontWeight: '600' },
  editBtn: { padding: 8 },
  editIcon: { fontSize: 20 },

  // 통계 영역
  statsRow: { flexDirection: 'row', marginBottom: 32 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#EBF4FA', 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 32,
  },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  statLabel: { fontSize: 16, color: '#111', fontWeight: '500' },

  // 환경설정 영역
  settingsSection: { paddingHorizontal: 4 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  settingsHeaderIcon: { fontSize: 20, marginRight: 8 },
  settingsTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  
  settingsBox: { 
    backgroundColor: '#F4F6F8', // 연한 회색 배경
    borderRadius: 24, 
    padding: 24,
  },
  settingsItem: { paddingVertical: 12, marginBottom: 8 },
  settingsItemText: { fontSize: 16, color: '#111' },
});

export default MyScreen;