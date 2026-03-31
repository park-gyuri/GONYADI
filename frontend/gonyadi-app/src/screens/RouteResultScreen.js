import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Animated, Modal, Platform, ToastAndroid, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

// 🌟 우리가 만든 '폴더 생성 모달' 부품 불러오기!
import FolderCreateModal from '../components/FolderCreateModal';
import WastebasketIcon from '../components/icons/wastebasketIcon';
import MarkerIcon from '../components/icons/markerIcon';
import SendIcon from '../components/icons/sendIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RouteResultScreen = () => {
  const router = useRouter();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaveModalVisible, setSaveModalVisible] = useState(false); // 기존 경로 저장 팝업 스위치

  // 🌟 새 폴더 만들기 팝업 스위치 추가! (기본값: 꺼짐)
  const [isFolderCreateVisible, setFolderCreateVisible] = useState(false);

  const animatedHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.45)).current;

  const toggleSheet = () => {
    const toValue = isExpanded ? SCREEN_HEIGHT * 0.45 : SCREEN_HEIGHT * 0.8;

    Animated.timing(animatedHeight, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setIsExpanded(!isExpanded);
  };

  const [places, setPlaces] = useState([
    { id: 1, name: '장소A', address: '경상북도 영주시 어쩌구', transport: '도보 20분 이동' },
    { id: 2, name: '장소B', address: '경상북도 영주시 어쩌구', transport: '버스 20분 이동' },
    { id: 3, name: '장소C', address: '경상북도 영주시 어쩌구', transport: '도보 10분 이동' },
    { id: 4, name: '장소D', address: '경상북도 영주시 어쩌구', transport: null },
  ]);

  const handleDeletePlace = (id) => {
    if (places.length <= 1) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('최소 1개의 장소는 남겨두어야 합니다.', ToastAndroid.SHORT);
      } else {
        // iOS 등 다른 플랫폼에서는 모달/알림창 대신 타이머 기반의 커스텀 Toast를 쓸 수도 있지만, 기본은 Alert 사용
        Alert.alert('', '최소 1개의 장소는 남겨두어야 합니다.');
      }
      return;
    }

    setPlaces(prevPlaces => prevPlaces.filter(place => place.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 경로 추천받기</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mapArea}>
        <Text style={styles.mapText}>🗺️ 지도 API가 들어올 자리</Text>
      </View>

      <Animated.View style={[styles.bottomSheet, { height: animatedHeight }]}>

        <TouchableOpacity style={styles.handleWrapper} activeOpacity={0.6} onPress={toggleSheet}>
          <View style={styles.dragHandle} />
        </TouchableOpacity>

        <ScrollView style={styles.routeList} showsVerticalScrollIndicator={false}>
          {places.map((place, index) => (
            <View key={place.id}>

              <View style={styles.placeCard}>
                <View style={styles.placeInfo}>
                  <View style={styles.placeNameRow}>
                    <MarkerIcon width={20} height={20} />
                    <Text style={styles.placeNameText}>{place.name}</Text>
                  </View>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePlace(place.id)}>
                  <WastebasketIcon width={24} height={24} />
                </TouchableOpacity>
              </View>

              {/* 다음 장소로 가는 이동 수단 연결선 (마지막 장소면 표시하지 않음) */}
              {place.transport && index < places.length - 1 ? (
                <View style={styles.transportInfo}>
                  <View style={styles.verticalLine} />
                  <Text style={styles.transportText}>{place.transport}</Text>
                </View>
              ) : null}

            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>수정사항을 입력하세요</Text>
          <View style={styles.llmInputWrapper}>
            <TextInput style={styles.llmInput} placeholder="예: 장소B는 빼고 맛집 하나 추가해줘" />
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <SendIcon width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>공유하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setSaveModalVisible(true)}>
            <Text style={styles.actionBtnText}>저장하기</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* 🌟 1단계: 기존 경로 저장하기 팝업창(모달) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isSaveModalVisible}
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSaveModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.saveModalBox}>

            <View style={styles.saveModalHeader}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={styles.modalBackBtn}>
                <Text style={styles.modalBackIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.saveModalTitle}>경로를 저장하시겠습니까?</Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={styles.saveSectionTitle}>저장할 폴더 선택하세요</Text>
            <View style={styles.folderTagsRow}>
              <TouchableOpacity style={styles.folderTag}>
                <Text style={styles.folderTagText}>해외</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.folderTag}>
                <Text style={styles.folderTagText}>국내</Text>
              </TouchableOpacity>

              {/* 🌟 2단계: 대망의 + 버튼! 누르면 폴더 생성 스위치 ON! */}
              <TouchableOpacity
                style={styles.folderTagPlus}
                onPress={() => setFolderCreateVisible(true)}
              >
                <Text style={styles.folderTagPlusText}>+</Text>
              </TouchableOpacity>

            </View>

            <Text style={styles.saveSectionTitle}>제목을 입력하세요</Text>
            <TextInput style={styles.saveTitleInput} />

            <View style={styles.saveConfirmBtnRow}>
              <TouchableOpacity style={styles.saveConfirmBtn} onPress={() => setSaveModalVisible(false)}>
                <Text style={styles.saveConfirmBtnText}>저장하기</Text>
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 🌟 3단계: 새 폴더 만들기 팝업창 (스위치가 켜지면 제일 위에 겹쳐서 뜹니다) */}
      <FolderCreateModal
        visible={isFolderCreateVisible}
        onClose={() => setFolderCreateVisible(false)}
      />

    </SafeAreaView>
  );
};

// ==================================================
// 🎨 스타일시트 (유저님 코드 그대로 유지)
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, backgroundColor: '#FFFFFF', zIndex: 10 },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  mapArea: { flex: 1, backgroundColor: '#EAF3FA', justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 16, color: '#555', fontWeight: 'bold' },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
  handleWrapper: { width: '100%', alignItems: 'center', paddingVertical: 20 },
  dragHandle: { width: 60, height: 5, backgroundColor: '#8E9EAB', borderRadius: 3 },
  routeList: { flex: 1, marginTop: 0 },
  placeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  placeInfo: { flex: 1 },
  placeNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  placeNameText: { fontSize: 16, fontWeight: 'bold', color: '#111', marginLeft: 6 },
  placeAddress: { fontSize: 13, color: '#666', marginLeft: 26 },
  deleteBtn: { padding: 8 },
  transportInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 24, marginVertical: 8 },
  verticalLine: { width: 2, height: 30, backgroundColor: '#D1D5DB', marginRight: 12 },
  transportText: { fontSize: 13, color: '#3A7BD5', fontWeight: 'bold' },
  inputSection: { marginTop: 10, marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  llmInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCFFE8', borderWidth: 1, borderColor: '#DCE5B6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  llmInput: { flex: 1, fontSize: 14, color: '#333' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, backgroundColor: '#A9E2D9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { fontSize: 16, fontWeight: 'bold', color: '#111' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  saveModalBox: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  saveModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalBackBtn: { padding: 4 },
  modalBackIcon: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  saveModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  saveSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  folderTagsRow: { flexDirection: 'row', marginBottom: 24 },
  folderTag: { borderWidth: 1, borderColor: '#C4CCD8', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16, marginRight: 8 },
  folderTagText: { fontSize: 14, color: '#333' },
  folderTagPlus: { borderWidth: 1, borderColor: '#C4CCD8', borderRadius: 8, width: 36, alignItems: 'center', justifyContent: 'center' },
  folderTagPlusText: { fontSize: 16, color: '#555' },
  saveTitleInput: { 
    backgroundColor: '#FCFFE8', 
    borderRadius: 8, 
    height: 48, 
    paddingHorizontal: 16, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DCE5B6'
  },
  saveConfirmBtnRow: { alignItems: 'flex-end' },
  saveConfirmBtn: { backgroundColor: '#A9E2D9', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  saveConfirmBtnText: { fontSize: 16, fontWeight: 'bold', color: '#111' },
});

export default RouteResultScreen;