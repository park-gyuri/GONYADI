// src/screens/MyScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import MyIcon from '../components/icons/myIcon';
import SettingIcon from '../components/icons/settingIcon';
import PencilIcon from '../components/icons/pencilIcon';

import { useRoutes } from '../context/RouteContext';
import { apiClient, BASE_URL } from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyScreen = () => {
  const router = useRouter();
  const { allRoutes, reviews, likedReviews, clearRouteData } = useRoutes();
  const [userProfile, setUserProfile] = useState({ user_nickname: '로딩중...', user_id: '' });

  // 좋아요 누른 리뷰 개수 계산
  const likedCount = Object.keys(likedReviews).filter(k => likedReviews[k]).length;

  // 모달 상태 관리
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileImage, setProfileImage] = useState(null); // 로컬 이미지 URI 저장

  const [isAccountModalVisible, setAccountModalVisible] = useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient('/api/v1/auth/me');
        setUserProfile(data);
        setEditName(data.user_nickname);
        // 서버의 프로필 이미지가 있는 경우 우선 적용, 없으면 기존 로컬 캐시 적용
        if (data.user_profile_image) {
          const fullUrl = data.user_profile_image.startsWith('http') 
            ? data.user_profile_image 
            : `${BASE_URL}${data.user_profile_image}`;
          setProfileImage(fullUrl);
        } else {
          const savedImage = await AsyncStorage.getItem(`profile_image_${data.user_id}`);
          if (savedImage) setProfileImage(savedImage);
        }
      } catch (error) {
        console.error('프로필 로딩 실패:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    clearRouteData();
    setAccountModalVisible(false);
    router.replace('/login');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    try {
      let uploadedImageUrl = userProfile.user_profile_image;

      // 새 이미지가 로컬 경로(file:// 등)인 경우 서버에 업로드 진행
      if (profileImage && !profileImage.startsWith('http')) {
        const filename = profileImage.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const formData = new FormData();
        formData.append('file', {
          uri: profileImage,
          name: filename,
          type: type,
        });

        const uploadResponse = await apiClient('/api/v1/auth/me/profile-image', {
          method: 'POST',
          body: formData,
        }, 30000);
        uploadedImageUrl = uploadResponse.user_profile_image;
      }

      const response = await apiClient('/api/v1/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ 
          user_nickname: editName,
          user_profile_image: uploadedImageUrl
        })
      });

      setUserProfile({ 
        ...userProfile, 
        user_nickname: response.user_nickname || editName,
        user_profile_image: response.user_profile_image || uploadedImageUrl
      });

      if (profileImage) {
        await AsyncStorage.setItem(`profile_image_${userProfile.user_id}`, profileImage);
      }

      setProfileModalVisible(false);
      Alert.alert('안내', '프로필이 성공적으로 업데이트 되었습니다.');
    } catch (e) {
      console.error('프로필 업데이트 실패:', e);
      Alert.alert('오류', '프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      "계정 탈퇴",
      "정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: async () => {
            try {
              // 백엔드 탈퇴 API 호출
              await apiClient('/api/v1/auth/me', { method: 'DELETE' });
              
              await AsyncStorage.clear();
              clearRouteData();
              setAccountModalVisible(false);
              router.replace('/login');
              Alert.alert('안내', '계정이 정상적으로 탈퇴되었습니다.');
            } catch (error) {
              console.error('계정 탈퇴 실패:', error);
              Alert.alert('오류', '계정 탈퇴 처리 중 문제가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* 1. 상단 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>

        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => setProfileModalVisible(true)}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile.user_nickname}</Text>
            <Text style={styles.profilePoints}>포인트 0P</Text>
          </View>

          <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={() => {
            setEditName(userProfile.user_nickname);
            setProfileModalVisible(true);
          }}>
            <PencilIcon width={28} height={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* 3. 활동 통계 영역 (찜한 리뷰 내역 & 작성한 후기) */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push('/liked-reviews')}
          >
            <Text style={styles.statNumber}>{likedCount}</Text>
            <Text style={styles.statLabel}>찜한 리뷰 내역</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.8}
            onPress={() => router.push('/my-review-history')}
          >
            <Text style={styles.statNumber}>{reviews.length}</Text>
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
            <TouchableOpacity style={styles.settingsItem} activeOpacity={0.6} onPress={() => setAccountModalVisible(true)}>
              <Text style={styles.settingsItemText}>계정설정</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} activeOpacity={0.6}>
              <Text style={styles.settingsItemText}>알림설정</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 5. 프로필 편집 모달 */}
      <Modal visible={isProfileModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>프로필 편집</Text>

            <TouchableOpacity onPress={pickImage} style={styles.imageUploadBtn}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.modalAvatar} />
              ) : (
                <View style={styles.modalAvatarPlaceholder}>
                  <Text style={styles.imageUploadText}>사진 선택</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="이름을 입력하세요"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setProfileModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveProfile}>
                <Text style={styles.modalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. 계정 설정 모달 */}
      <Modal visible={isAccountModalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setAccountModalVisible(false)}>
          <View style={styles.optionBox}>
            <Text style={styles.optionTitle}>계정 설정</Text>
            <TouchableOpacity style={styles.optionBtn} onPress={handleLogout}>
              <Text style={styles.optionBtnText}>로그아웃</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={deleteAccount}>
              <Text style={[styles.optionBtnText, { color: '#E57373' }]}>계정 탈퇴하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setAccountModalVisible(false)}>
              <Text style={styles.optionBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
  editBtn: { padding: 10 },

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

  // 모달 스타일
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#111' },
  imageUploadBtn: { marginBottom: 20 },
  modalAvatar: { width: 100, height: 100, borderRadius: 50 },
  modalAvatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  imageUploadText: { color: '#888', fontSize: 14 },
  nameInput: { width: '100%', height: 48, borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 16, fontSize: 16, marginBottom: 24 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#F0F0F0', marginRight: 8, alignItems: 'center' },
  modalCancelText: { fontSize: 16, color: '#555', fontWeight: 'bold' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#1ABC9C', marginLeft: 8, alignItems: 'center' },
  modalSaveText: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },

  optionBox: { width: '75%', backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  optionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  optionBtn: { paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'center' },
  optionBtnText: { fontSize: 16, color: '#333' },
});

export default MyScreen;