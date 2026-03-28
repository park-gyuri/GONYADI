// src/screens/MyScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import MyIcon from '../components/icons/myIcon';
import SettingIcon from '../components/icons/settingIcon';
import PencilIcon from '../components/icons/pencilIcon';

const MyScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* 1. 상단 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>

        <View style={styles.profileCard}>
          <View style={styles.avatar} />

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>홍길동</Text>
            <Text style={styles.profilePoints}>포인트 0P</Text>
          </View>

          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
            <PencilIcon width={24} height={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* 3. 활동 통계 영역 (저장된 경로 & 작성한 후기) */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push('/route')}
          >
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>저장된 경로</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push('/my-review-history')}
          >
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>작성한 후기</Text>
          </TouchableOpacity>
        </View>

        {/* 4. 환경설정 영역 */}
        <View style={styles.settingsSection}>

          {/* 환경설정 타이틀 */}
          <View style={styles.settingsHeader}>
            <SettingIcon width={18} height={18} color="#000" style={{ marginRight: 8 }} />
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

            <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} activeOpacity={0.6}>
              <Text style={styles.settingsItemText}>로그아웃</Text>
            </TouchableOpacity>
          </View>

        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
    backgroundColor: '#BCEBE3',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A8D8CF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, justifyContent: 'center' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  profilePoints: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  editBtn: { padding: 4 },

  // 통계 영역
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FCFFE8',
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#DCE5B6',
    alignItems: 'center',
    paddingVertical: 20,
  },
  statCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statDivider: { width: 1, height: '60%', backgroundColor: '#DCE5B6' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  statLabel: { fontSize: 16, color: '#111', fontWeight: '500' },

  // 환경설정 영역
  settingsSection: { paddingHorizontal: 4 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  settingsTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  settingsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C4CCD8',
  },
  settingsItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  settingsItemText: { fontSize: 16, color: '#111' },
});

export default MyScreen;