import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RouteResultScreen = () => {
  const router = useRouter();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);

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

  const dummyPlaces = [
    { id: 1, name: '장소A', address: '경상북도 영주시 어쩌구', transport: '도보 20분 이동' },
    { id: 2, name: '장소B', address: '경상북도 영주시 어쩌구', transport: '버스 20분 이동' },
    { id: 3, name: '장소C', address: '경상북도 영주시 어쩌구', transport: '도보 10분 이동' },
    { id: 4, name: '장소D', address: '경상북도 영주시 어쩌구', transport: null },
  ];

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
          {dummyPlaces.map((place) => (
            <View key={place.id}>
              
              <View style={styles.placeCard}>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>📍 {place.name}</Text>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {place.transport ? (
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
            <TouchableOpacity>
              <Text style={styles.sendIcon}>➤</Text>
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

      {/* 🌟 저장하기 팝업창(모달) */}
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
              <TouchableOpacity style={styles.folderTagPlus}>
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

    </SafeAreaView>
  );
};

// ==================================================
// 🎨 스타일시트
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
  placeName: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  placeAddress: { fontSize: 13, color: '#666', marginLeft: 22 },
  deleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  transportInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 24, marginVertical: 8 },
  verticalLine: { width: 2, height: 30, backgroundColor: '#D1D5DB', marginRight: 12 },
  transportText: { fontSize: 13, color: '#3A7BD5', fontWeight: 'bold' },
  inputSection: { marginTop: 10, marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  llmInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F6FA', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  llmInput: { flex: 1, fontSize: 14, color: '#333' },
  sendIcon: { fontSize: 20, color: '#4A5B6D', marginLeft: 10 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, backgroundColor: '#A9B6C2', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
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
  saveTitleInput: { backgroundColor: '#F0F6FA', borderRadius: 8, height: 48, paddingHorizontal: 12, marginBottom: 24 },
  saveConfirmBtnRow: { alignItems: 'flex-end' },
  saveConfirmBtn: { backgroundColor: '#A9B6C2', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  saveConfirmBtnText: { fontSize: 16, fontWeight: 'bold', color: '#111' },
});

export default RouteResultScreen;