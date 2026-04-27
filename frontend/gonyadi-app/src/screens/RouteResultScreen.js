import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Animated, Modal, Platform, ToastAndroid, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

// 지도 및 Context
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoutes } from '../context/RouteContext';
import { requestNewRoute } from '../api/routeApi';
import { fetchFolders, createFolder, saveItinerary } from '../api/saveApi';

// 우리가 만든 '폴더 생성 모달' 부품 불러오기!
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

  // 저장하기 관련 상태
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  // 🌟 전역 Context에서 추천받은 데이터 가져오기
  const { currentRecommendation, setCurrentRecommendation, currentFormData } = useRoutes();

  // 실제 데이터를 상태로 관리 (삭제 기능 유지를 위해)
  const [places, setPlaces] = useState([]);
  const [segments, setSegments] = useState([]);
  const mapRef = useRef(null);

  // 재추천 피드백 상태 관리
  const [updateMessage, setUpdateMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (currentRecommendation) {
      setPlaces(currentRecommendation.places || []);
      setSegments(currentRecommendation.route_segments || []);
    }
  }, [currentRecommendation]);

  // 장소 데이터가 바뀌면 지도를 해당 위치로 부드럽게 이동시킴
  useEffect(() => {
    if (mapRef.current && places.length > 0) {
      mapRef.current.animateToRegion({
        latitude: places[0].lat,
        longitude: places[0].lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [places]);

  // 저장 모달이 열릴 때 폴더 목록 불러오기
  useEffect(() => {
    if (isSaveModalVisible) {
      loadFolders();
      if (currentFormData && currentFormData.region && !saveTitle) {
        setSaveTitle(`${currentFormData.region} 여행 일정`);
      }
    }
  }, [isSaveModalVisible]);

  const loadFolders = async () => {
    try {
      const data = await fetchFolders();
      setFolders(data);
      if (data.length > 0) {
        setSelectedFolderId(data[0].folder_pk);
      }
    } catch (error) {
      Alert.alert('오류', '폴더 목록을 불러오지 못했습니다.');
    }
  };

  const handleCreateFolder = async (folderName) => {
    try {
      const newFolder = await createFolder(folderName);
      setFolders([newFolder, ...folders]);
      setSelectedFolderId(newFolder.folder_pk);
    } catch (error) {
      Alert.alert('오류', '폴더 생성에 실패했습니다.');
    }
  };

  const handleSaveItinerary = async () => {
    if (!saveTitle.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }
    
    setIsSaving(true);
    try {
      const itineraryData = {
        folder_id: selectedFolderId,
        title: saveTitle,
        region: currentFormData?.region || '기타',
        start_date: currentFormData?.startDate || null,
        end_date: currentFormData?.endDate || null,
        nights: currentFormData?.nights ? parseInt(currentFormData.nights) : null,
        days: currentFormData?.days ? parseInt(currentFormData.days) : null,
        number_of_people: currentFormData?.personCount || null,
        budget_per_person: currentFormData?.budget_per_person || null,
        recommendation_data: currentRecommendation
      };
      
      await saveItinerary(itineraryData);
      Alert.alert('성공', '여행 경로가 성공적으로 저장되었습니다!');
      setSaveModalVisible(false);
    } catch (error) {
      Alert.alert('오류', '경로 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

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

    setPlaces(prevPlaces => prevPlaces.filter(place => place.name !== id)); // name을 임시 id처럼 사용
  };

  // 가장 적절한(빠른) 이동 수단 찾기 로직
  const getBestRouteMode = (segment) => {
    if (!segment || !segment.routes) return null;
    
    // 유효한 폴리라인이 있는 수단들만 필터링
    const validModes = Object.keys(segment.routes).filter(mode => 
      segment.routes[mode] && 
      segment.routes[mode].polyline && 
      segment.routes[mode].polyline.length > 0
    );

    if (validModes.length === 0) return null;

    // 소요 시간(분) 기준으로 오름차순 정렬 (가장 빠른 수단이 우선)
    validModes.sort((a, b) => segment.routes[a].duration_minutes - segment.routes[b].duration_minutes);

    // 특별 우선순위: 도보가 30분 이내라면 자동차/대중교통보다 도보를 우선 (풍경 감상 등)
    const walkMode = validModes.find(m => m === 'walk');
    if (walkMode && segment.routes[walkMode].duration_minutes <= 30) {
      return walkMode;
    }

    return validModes[0];
  };

  // 🌟 재추천 API 호출 함수
  const handleUpdateRoute = async () => {
    if (!updateMessage.trim()) return;
    if (!currentFormData) {
      Alert.alert('오류', '이전 입력 정보가 없어 재추천을 진행할 수 없습니다.');
      return;
    }

    setIsUpdating(true);
    try {
      // 1. 기존 formData에 사용자 피드백(userMessage)과 기존 장소(original_places) 덮어쓰기
      const newFormData = {
        ...currentFormData,
        userMessage: updateMessage,
        original_places: places, // 현재 목록(삭제 등 반영)을 전송
      };

      // 2. API 요청
      const result = await requestNewRoute(newFormData);

      // 3. 전역 상태 및 로컬 상태 업데이트
      setCurrentRecommendation(result);
      setUpdateMessage(''); // 입력창 초기화
      Alert.alert('완료', '일정이 수정되었습니다.');

    } catch (error) {
      Alert.alert('경로 수정 실패', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // 폴리라인 색상 맵
  const getPolylineColor = (mode) => {
    switch(mode) {
      case 'walk': return '#4CAF50';   // 녹색
      case 'drive': return '#2196F3';  // 파란색
      case 'bicycle': return '#FF9800';// 주황색
      case 'transit': return '#9C27B0';// 보라색
      default: return '#333333';
    }
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
        {Platform.OS === 'web' ? (
          <Text style={styles.mapText}>🗺️ 웹에서는 지도를 지원하지 않습니다.{'\n'}모바일(안드로이드/iOS)에서 확인해주세요.</Text>
        ) : (
          places.length > 0 ? (
            <MapView 
              ref={mapRef}
              style={{ width: '100%', height: '100%' }}
              initialRegion={{
                latitude: places[0].lat,
                longitude: places[0].lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {/* 장소 마커 표시 */}
              {places.map((place, idx) => (
                <Marker 
                  key={`marker-${idx}`}
                  coordinate={{ latitude: place.lat, longitude: place.lng }}
                  title={`${idx + 1}. ${place.name}`}
                  description={place.reason}
                />
              ))}

              {/* 경로 폴리라인 표시 */}
              {segments.map((seg, idx) => {
                const routeMode = getBestRouteMode(seg);
                if (!routeMode) return null;

                const routeData = seg.routes[routeMode];
                // TMAP 좌표는 [[lat, lng], ...] 형태로 변환되어 있다고 가정
                const coordinates = routeData.polyline.map(coord => ({
                  latitude: coord[0],
                  longitude: coord[1],
                }));

                return (
                  <Polyline 
                    key={`poly-${idx}`}
                    coordinates={coordinates}
                    strokeColor={getPolylineColor(routeMode)}
                    strokeWidth={4}
                  />
                );
              })}
            </MapView>
          ) : (
            <Text style={styles.mapText}>경로 데이터가 없습니다.</Text>
          )
        )}
      </View>

      <Animated.View style={[styles.bottomSheet, { height: animatedHeight }]}>

        <TouchableOpacity style={styles.handleWrapper} activeOpacity={0.6} onPress={toggleSheet}>
          <View style={styles.dragHandle} />
        </TouchableOpacity>

        <ScrollView style={styles.routeList} showsVerticalScrollIndicator={false}>
          {places.map((place, index) => {
            // 해당 장소에서 다음 장소로 가는 세그먼트
            const segment = segments[index];
            let transportText = null;

            if (segment && index < places.length - 1) {
              const bestMode = getBestRouteMode(segment);
              
              if (bestMode) {
                const bestRoute = segment.routes[bestMode];
                let modeKo = bestRoute.travel_mode === 'walk' ? '도보' : 
                             bestRoute.travel_mode === 'drive' ? '자동차' : 
                             bestRoute.travel_mode === 'transit' ? '대중교통' : '자전거';
                
                transportText = `${modeKo} ${Math.round(bestRoute.duration_minutes)}분 이동`;
              }
            }

            return (
            <View key={place.name}>

              <View style={styles.placeCard}>
                <View style={styles.placeInfo}>
                  <View style={styles.placeNameRow}>
                    <MarkerIcon width={20} height={20} />
                    <Text style={styles.placeNameText}>{place.name}</Text>
                  </View>
                  <Text style={styles.placeAddress}>{place.category} · {place.reason}</Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePlace(place.name)}>
                  <WastebasketIcon width={24} height={24} />
                </TouchableOpacity>
              </View>

              {/* 다음 장소로 가는 이동 수단 연결선 */}
              {transportText ? (
                <View style={styles.transportInfo}>
                  <View style={styles.verticalLine} />
                  <Text style={styles.transportText}>{transportText}</Text>
                </View>
              ) : null}

            </View>
          )})}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>수정사항을 입력하세요</Text>
          <View style={styles.llmInputWrapper}>
            <TextInput 
              style={styles.llmInput} 
              placeholder="예: 장소B는 빼고 맛집 하나 추가해줘" 
              value={updateMessage}
              onChangeText={setUpdateMessage}
              editable={!isUpdating}
            />
            {isUpdating ? (
              <ActivityIndicator size="small" color="#52b19e" style={{ marginHorizontal: 10 }} />
            ) : (
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={handleUpdateRoute}>
                <SendIcon width={24} height={24} />
              </TouchableOpacity>
            )}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderTagsRow}>
              {folders.map(folder => (
                <TouchableOpacity 
                  key={folder.folder_pk}
                  style={[styles.folderTag, selectedFolderId === folder.folder_pk && styles.folderTagSelected]}
                  onPress={() => setSelectedFolderId(folder.folder_pk)}
                >
                  <Text style={[styles.folderTagText, selectedFolderId === folder.folder_pk && styles.folderTagTextSelected]}>
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* 🌟 2단계: 대망의 + 버튼! 누르면 폴더 생성 스위치 ON! */}
              <TouchableOpacity
                style={styles.folderTagPlus}
                onPress={() => setFolderCreateVisible(true)}
              >
                <Text style={styles.folderTagPlusText}>+</Text>
              </TouchableOpacity>

            </ScrollView>

            <Text style={styles.saveSectionTitle}>제목을 입력하세요</Text>
            <TextInput 
              style={styles.saveTitleInput} 
              value={saveTitle}
              onChangeText={setSaveTitle}
            />

            <View style={styles.saveConfirmBtnRow}>
              <TouchableOpacity style={styles.saveConfirmBtn} onPress={handleSaveItinerary} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#111" />
                ) : (
                  <Text style={styles.saveConfirmBtnText}>저장하기</Text>
                )}
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 🌟 3단계: 새 폴더 만들기 팝업창 (스위치가 켜지면 제일 위에 겹쳐서 뜹니다) */}
      <FolderCreateModal
        visible={isFolderCreateVisible}
        onClose={() => setFolderCreateVisible(false)}
        onSubmit={(folderName) => {
          handleCreateFolder(folderName);
          setFolderCreateVisible(false);
        }}
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
  folderTagSelected: { backgroundColor: '#111', borderColor: '#111' },
  folderTagText: { fontSize: 14, color: '#333' },
  folderTagTextSelected: { color: '#FFF', fontWeight: 'bold' },
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