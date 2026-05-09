import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Animated, Modal, Platform, ToastAndroid, Alert, ActivityIndicator, PanResponder, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
// react-native-maps는 Expo Go에서 지원되지 않으므로 안전하게 불러오기
let MapView, Marker, Polyline;
let isMapAvailable = false;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  isMapAvailable = true;
} catch (e) {
  console.log('[지도] react-native-maps를 불러올 수 없어 대체 UI를 표시합니다.');
}

// 🌟 우리가 만든 '폴더 생성 모달' 부품 불러오기!
import FolderCreateModal from '../components/FolderCreateModal';
import { requestNewRoute, saveItinerary } from '../api/routeApi';
import { useRoutes } from '../context/RouteContext';
import WastebasketIcon from '../components/icons/wastebasketIcon';
import MarkerIcon from '../components/icons/markerIcon';
import SendIcon from '../components/icons/sendIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RouteResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { folders, addFolder, setAllRoutes } = useRoutes();

  // API로부터 받은 원본 데이터 파싱
  const apiData = params.response ? JSON.parse(params.response) : null;
  const originalRequest = params.originalRequest ? JSON.parse(params.originalRequest) : null;

  // 장소(places)와 이동수단(route_segments) 추출
  const places = apiData?.places || [];
  const routeSegments = apiData?.route_segments || [];

  const [selectedDay, setSelectedDay] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);
  const [isFolderCreateVisible, setFolderCreateVisible] = useState(false);
  const [modifyText, setModifyText] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);
  const placeRefs = useRef({});

  const animatedHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.55)).current;
  const animatedBottom = useRef(new Animated.Value(0)).current;
  const lastHeight = useRef(SCREEN_HEIGHT * 0.55);
  const heightBeforeKeyboard = useRef(SCREEN_HEIGHT * 0.55);

  const MIN_HEIGHT = SCREEN_HEIGHT * 0.30;
  const MID_HEIGHT = SCREEN_HEIGHT * 0.55;
  const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;

  // 키보드 등장 시 바텀 시트를 자동으로 최대 높이로 확장
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const kbHeight = e.endCoordinates.height;
        heightBeforeKeyboard.current = lastHeight.current;
        lastHeight.current = MAX_HEIGHT;
        Animated.parallel([
          Animated.timing(animatedHeight, {
            toValue: MAX_HEIGHT,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(animatedBottom, {
            toValue: kbHeight,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        const restoreHeight = heightBeforeKeyboard.current;
        lastHeight.current = restoreHeight;
        Animated.parallel([
          Animated.timing(animatedHeight, {
            toValue: restoreHeight,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(animatedBottom, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start();
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        // 손가락을 위로 올리면 dy < 0 → 높이 증가
        const newHeight = lastHeight.current - gestureState.dy;
        const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
        animatedHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentHeight = lastHeight.current - gestureState.dy;
        // 가장 가까운 스냅 포인트로 이동
        const snapPoints = [MIN_HEIGHT, MID_HEIGHT, MAX_HEIGHT];
        let target = MID_HEIGHT;
        let minDist = Infinity;
        for (const point of snapPoints) {
          const dist = Math.abs(currentHeight - point);
          if (dist < minDist) {
            minDist = dist;
            target = point;
          }
        }
        // 빠른 스와이프 감지: 속도가 빠르면 방향으로 스냅
        if (Math.abs(gestureState.vy) > 0.5) {
          target = gestureState.dy > 0 ? MIN_HEIGHT : MAX_HEIGHT;
        }
        lastHeight.current = target;
        Animated.spring(animatedHeight, {
          toValue: target,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
      },
    })
  ).current;

  // 백엔드 데이터(places) 또는 더미 데이터(schedule)를 프론트엔드 UI에 맞게 변환
  const [daysData, setDaysData] = useState(() => {
    if (apiData?.schedule) {
      // 1. dummyData.js의 schedule 형식이 있는 경우 (Day 1, 2, 3 지원)
      const data = {};
      apiData.schedule.forEach(dayInfo => {
        data[dayInfo.day] = dayInfo.places.map((place, index) => ({
          id: place.id || `${dayInfo.day}-${index}`,
          name: place.name,
          address: place.address || place.description,
          transport: place.transport ? `${place.transport.type} ${place.transport.duration}` : null,
          lat: place.lat || (35.10 + Math.random() * 0.05), // 위치 정보 없으면 랜덤 (데모용)
          lng: place.lng || (129.04 + Math.random() * 0.05)
        }));
      });
      return data;
    } else {
      // 2. 기존 백엔드 API 형식 (places 단일 리스트)
      return {
        1: places.map((place, index) => {
          const segment = routeSegments.find(seg => seg.from_name === place.name);
          let transportText = null;
          if (segment && segment.routes) {
            const mode = Object.keys(segment.routes)[0];
            if (mode && segment.routes[mode]) {
              transportText = `${mode === 'walk' ? '도보' : mode === 'drive' ? '자동차' : mode === 'transit' ? '대중교통' : mode} ${Math.round(segment.routes[mode].duration_minutes)}분 이동`;
            }
          }
          return {
            id: index + 1,
            name: place.name,
            address: place.reason,
            transport: transportText,
            lat: place.lat,
            lng: place.lng
          };
        })
      };
    }
  });

  // 두 좌표 간 직선거리 계산 (Haversine, km 단위)
  const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 거리(km)와 이동수단으로 예상 시간(분) 계산
  const estimateTransport = (distKm) => {
    // 도보 기준 (시속 4km), 실제 도로는 직선의 약 1.3배
    const realDist = distKm * 1.3;
    const walkMin = Math.round(realDist / 4 * 60);
    if (walkMin <= 20) {
      return `도보 약 ${walkMin}분 이동`;
    }
    // 자동차 기준 (시속 30km, 시내)
    const driveMin = Math.max(5, Math.round(realDist / 30 * 60));
    return `자동차 약 ${driveMin}분 이동`;
  };

  const handleDeletePlace = (id) => {
    setDaysData(prev => {
      const currentPlaces = prev[selectedDay];
      const deleteIndex = currentPlaces.findIndex(p => p.id === id);
      if (deleteIndex === -1) return prev;

      const newPlaces = currentPlaces.filter(p => p.id !== id);

      // 삭제 후 앞 장소의 이동수단 정보를 재계산
      if (deleteIndex > 0 && newPlaces.length > 0) {
        const prevPlace = newPlaces[deleteIndex - 1];
        const nextPlace = newPlaces[deleteIndex];

        if (nextPlace) {
          // 먼저 백엔드 데이터에서 찾기
          const newSegment = routeSegments.find(seg => seg.from_name === prevPlace.name && seg.to_name === nextPlace.name);
          if (newSegment && newSegment.routes) {
            const mode = Object.keys(newSegment.routes)[0];
            if (mode && newSegment.routes[mode]) {
              prevPlace.transport = `${mode === 'walk' ? '도보' : mode === 'drive' ? '자동차' : mode === 'transit' ? '대중교통' : mode} ${Math.round(newSegment.routes[mode].duration_minutes)}분 이동`;
            } else {
              // 백엔드에 없으면 좌표로 직접 추정
              const dist = getDistanceKm(prevPlace.lat, prevPlace.lng, nextPlace.lat, nextPlace.lng);
              prevPlace.transport = estimateTransport(dist);
            }
          } else {
            // 백엔드에 없으면 좌표로 직접 추정
            const dist = getDistanceKm(prevPlace.lat, prevPlace.lng, nextPlace.lat, nextPlace.lng);
            prevPlace.transport = estimateTransport(dist);
          }
        } else {
          prevPlace.transport = null;
        }
      }

      // 첫 번째 장소가 삭제된 경우에도 처리
      if (deleteIndex === 0 && newPlaces.length > 0) {
        // 새로운 첫 번째 장소 → 그 이전 transport는 의미 없으므로 유지
      }

      // 마지막 장소의 transport는 항상 null
      if (newPlaces.length > 0) {
        newPlaces[newPlaces.length - 1].transport = null;
      }

      return { ...prev, [selectedDay]: [...newPlaces] };
    });
  };

  // 수정사항 전송 (재추천 요청)
  const handleModifySubmit = async () => {
    if (!modifyText.trim()) {
      Alert.alert('안내', '수정사항을 입력해주세요.');
      return;
    }

    setIsModifying(true);
    try {
      const { requestNewRoute } = require('../api/routeApi');

      // 현재 화면의 장소 목록 (삭제 반영된 상태)을 전달
      const currentPlaces = daysData[selectedDay] || [];
      const placesForApi = currentPlaces.map(p => ({
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        reason: p.address,
        duration: 60,
        category: '관광',
      }));

      const modifyData = {
        ...(originalRequest || { region: '서울', transports: ['도보'], themes: ['힐링'], days: 3, nights: 2 }),
        user_message: modifyText,
        original_places: placesForApi,
      };

      console.log('[수정 요청] Payload:', JSON.stringify(modifyData));
      const data = await requestNewRoute(modifyData);

      router.replace({
        pathname: '/route-result',
        params: {
          response: JSON.stringify(data),
          originalRequest: params.originalRequest || JSON.stringify(originalRequest),
        }
      });
    } catch (error) {
      console.error('[수정 실패]', error.message);
      Alert.alert('에러', '수정 요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsModifying(false);
      setModifyText('');
    }
  };

  // 저장 모달이 열릴 때마다 초기값 설정
  useEffect(() => {
    if (isSaveModalVisible) {
      setSaveTitle('');
      // 폴더가 있고 선택된게 없으면 첫 번째 폴더 자동 선택
      if (folders.length > 0 && !selectedFolderId) {
        setSelectedFolderId(folders[0].folder_pk);
      }
    }
  }, [isSaveModalVisible]);

  // 새 폴더 생성
  const handleCreateFolder = (folderName) => {
    addFolder(folderName);
    Alert.alert('안내', '새 폴더가 생성되었습니다.');
  };

  // 실제 경로 저장하기
  const handleSaveItinerary = async () => {
    if (!saveTitle.trim()) {
      Alert.alert('안내', '제목을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      // 선택된 폴더 이름 찾기
      const folder = folders.find(f => f.folder_pk === selectedFolderId);
      const folderName = folder ? folder.name : '국내';

      const itineraryData = {
        folder_id: selectedFolderId,
        title: saveTitle,
        region: originalRequest?.region || '알 수 없음',
        days: originalRequest?.days || 2,
        recommendation_data: apiData,
      };

      // 🌟 백엔드 저장 API 호출
      const result = await saveItinerary(itineraryData);

      // 전역 Context 상태 업데이트 (서버에서 받은 PK 등을 포함)
      const newSavedRoute = {
        id: result.itinerary_pk || Date.now(),
        category: folderName,
        title: result.title,
        location: result.region,
        date: new Date().toISOString().split('T')[0],
        days: result.days,
        isFavorite: false,
        recommendation_data: result.recommendation_data,
      };

      setAllRoutes(prev => [...prev, newSavedRoute]);

      Alert.alert('저장 완료', '경로가 성공적으로 저장되었습니다!', [
        { text: '확인', onPress: () => {
            setSaveModalVisible(false);
            router.push('/route');
        }}
      ]);
    } catch (error) {
      console.error('[저장 실패]', error);
      Alert.alert('에러', '경로 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 현재 화면에 표시 중인 장소 목록 (삭제 반영)
  const activePlaces = daysData[selectedDay] || [];
  const activeNames = new Set(activePlaces.map(p => p.name));

  // Polyline 추출 (삭제된 장소의 구간은 제외)
  const allPolylines = routeSegments.flatMap(seg => {
    if (!seg.routes) return [];
    if (!activeNames.has(seg.from_name) || !activeNames.has(seg.to_name)) return [];
    const mode = Object.keys(seg.routes)[0];
    if (mode && seg.routes[mode] && seg.routes[mode].polyline) {
      return seg.routes[mode].polyline.map(coord => ({ latitude: coord[0], longitude: coord[1] }));
    }
    return [];
  });

  // 지도 초기 중심점
  const initialRegion = activePlaces.length > 0 ? {
    latitude: activePlaces[0].lat,
    longitude: activePlaces[0].lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 35.8714354,
    longitude: 128.601445, 
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // 장소 카드 클릭 → 지도 카메라 이동 + 하이라이트
  const handlePlaceSelect = (place) => {
    setSelectedPlaceId(place.id);
    if (mapRef.current && isMapAvailable) {
      // 바텀 시트에 가려지지 않도록 마커를 지도 상단 1/3 위치에 표시
      // latitude를 약간 남쪽으로 오프셋하면 마커가 위로 올라감
      const latOffset = 0.004; // 바텀 시트 높이 보정
      mapRef.current.animateToRegion({
        latitude: place.lat - latOffset,
        longitude: place.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 400);
    }
  };

  // 마커 클릭 → 카드 하이라이트
  const handleMarkerPress = (place) => {
    setSelectedPlaceId(place.id);
    // 해당 카드로 스크롤
    if (placeRefs.current[place.id]) {
      placeRefs.current[place.id].measureLayout(
        scrollViewRef.current?.getInnerViewRef?.() || scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 10, animated: true });
        },
        () => {} // 실패 시 무시
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 🗺️ 지도 영역 */}
      <View style={styles.mapArea}>
        {isMapAvailable ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={initialRegion}
          >
            {activePlaces.map((place, index) => (
              <Marker
                key={`marker-${place.id}`}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                title={`${index + 1}. ${place.name}`}
                description={place.address}
                pinColor={selectedPlaceId === place.id ? '#43B0AB' : 'red'}
                onPress={() => handleMarkerPress(place)}
              />
            ))}
            {allPolylines.length > 0 && (
              <Polyline
                coordinates={allPolylines}
                strokeColor="#43B0AB"
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#EAF3FA', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🗺️</Text>
            <Text style={{ fontSize: 15, color: '#555', fontWeight: '600' }}>지도 영역</Text>
            <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>(개발 빌드 시 실제 지도가 표시됩니다)</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => router.back()} style={styles.mapBackButton}>
          <Text style={styles.mapBackIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.bottomSheet, { height: animatedHeight, bottom: animatedBottom }]}>
        <View {...panResponder.panHandlers} style={styles.handleWrapper}>
          <View style={styles.dragHandle} />
        </View>

        {/* 📅 일차 선택 탭 (데이터에 맞춰 동적 생성) */}
        <View style={styles.dayTabRow}>
          {Object.keys(daysData).sort((a, b) => a - b).map((day) => (
            <TouchableOpacity 
              key={day} 
              style={[styles.dayTab, selectedDay === parseInt(day, 10) && styles.dayTabActive]}
              onPress={() => setSelectedDay(parseInt(day, 10))}
            >
              <Text style={[styles.dayTabText, selectedDay === parseInt(day, 10) && styles.dayTabTextActive]}>{day}일차</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView ref={scrollViewRef} style={styles.routeList} showsVerticalScrollIndicator={false}>
          <View style={styles.timelineContainer}>
            {/* 왼쪽 수직 연결선 */}
            <View style={styles.mainVerticalLine} />
            
            <View style={{ flex: 1 }}>
              {daysData[selectedDay] && daysData[selectedDay].map((place, index) => (
                <View 
                  key={place.id} 
                  style={styles.placeItemWrapper}
                  ref={ref => { placeRefs.current[place.id] = ref; }}
                >
                  <TouchableOpacity 
                    style={[
                      styles.placeCard, 
                      selectedPlaceId === place.id && styles.placeCardSelected
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handlePlaceSelect(place)}
                  >
                    <View style={styles.placeInfo}>
                      <View style={styles.placeNameRow}>
                        <MarkerIcon width={22} height={22} color={selectedPlaceId === place.id ? '#43B0AB' : '#111'} />
                        <Text style={[
                          styles.placeNameText,
                          selectedPlaceId === place.id && { color: '#43B0AB' }
                        ]}>{place.name}</Text>
                      </View>
                      <Text style={styles.placeAddress}>{place.address}</Text>
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePlace(place.id)}>
                      <WastebasketIcon width={20} height={20} color="#A9E2D9" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* 이동 수단 정보 */}
                  {place.transport && (
                    <View style={styles.transportRow}>
                      <Text style={styles.transportText}>{place.transport}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* 하단 입력창 및 버튼 (Bottom Fix) */}
        <View style={styles.bottomFixedArea}>
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>수정사항을 입력하세요</Text>
            <View style={styles.llmInputWrapper}>
              <TextInput 
                style={styles.llmInput} 
                placeholder="조금 더 힐링 목적에 맞게 수정해줘" 
                placeholderTextColor="#999"
                value={modifyText}
                onChangeText={setModifyText}
                editable={!isModifying}
              />
              <TouchableOpacity 
                style={styles.sendBtn} 
                onPress={handleModifySubmit}
                disabled={isModifying}
              >
                {isModifying ? (
                  <ActivityIndicator size="small" color="#59B5AB" />
                ) : (
                  <SendIcon width={20} height={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>
            {isModifying && (
              <Text style={{ fontSize: 12, color: '#59B5AB', marginTop: 6, textAlign: 'center' }}>경로를 수정하고 있어요... 잠시만 기다려주세요 ✨</Text>
            )}
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>공유하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={() => setSaveModalVisible(true)}>
              <Text style={styles.actionBtnText}>저장하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        </Animated.View>

      {/* 기존 저장 모달 및 폴더 생성 모달 유지 */}
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
                  style={[styles.folderTag, selectedFolderId === folder.folder_pk && { borderColor: '#43B0AB', backgroundColor: '#F0FAF9' }]}
                  onPress={() => setSelectedFolderId(folder.folder_pk === selectedFolderId ? null : folder.folder_pk)}
                >
                  <Text style={[styles.folderTagText, selectedFolderId === folder.folder_pk && { color: '#43B0AB', fontWeight: 'bold' }]}>
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.folderTagPlus} onPress={() => setFolderCreateVisible(true)}>
                <Text style={styles.folderTagPlusText}>+</Text>
              </TouchableOpacity>
            </ScrollView>

            <Text style={styles.saveSectionTitle}>제목을 입력하세요</Text>
            <TextInput 
              style={styles.saveTitleInput} 
              value={saveTitle}
              onChangeText={setSaveTitle}
              placeholder="예: 대구 1박2일 힐링 여행"
            />
            <View style={styles.saveConfirmBtnRow}>
              <TouchableOpacity 
                style={styles.saveConfirmBtn} 
                onPress={handleSaveItinerary}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveConfirmBtnText}>저장하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <FolderCreateModal 
        visible={isFolderCreateVisible} 
        onClose={() => setFolderCreateVisible(false)} 
        onSubmit={handleCreateFolder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },
  mapArea: { flex: 1, backgroundColor: '#EAF3FA', position: 'relative' },
  mapBackButton: { position: 'absolute', top: 20, left: 20, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.8)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  mapBackIcon: { fontSize: 24, color: '#000' },
  mapPlaceholderText: { position: 'absolute', top: '30%', alignSelf: 'center', fontSize: 16, color: '#888', fontWeight: 'bold' },
  
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
  handleWrapper: { width: '100%', alignItems: 'center', paddingTop: 15, paddingBottom: 10 },
  dragHandle: { width: 80, height: 5, backgroundColor: '#555', borderRadius: 3 },
  
  dayTabRow: { flexDirection: 'row', marginBottom: 20 },
  dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', marginRight: 10 },
  dayTabActive: { backgroundColor: '#FFF', borderColor: '#DDD' },
  dayTabText: { fontSize: 14, color: '#999' },
  dayTabTextActive: { color: '#000', fontWeight: 'bold' },

  timelineContainer: { flexDirection: 'row', position: 'relative' },
  mainVerticalLine: { position: 'absolute', left: 11, top: 35, bottom: 45, width: 2, backgroundColor: '#444', zIndex: -1 },
  
  placeItemWrapper: { marginBottom: 15 },
  placeCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 25, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, marginLeft: 0, borderWidth: 2, borderColor: 'transparent' },
  placeCardSelected: { borderColor: '#43B0AB', backgroundColor: '#F0FAF9' },
  placeInfo: { flex: 1 },
  placeNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  placeNameText: { fontSize: 18, fontWeight: 'bold', color: '#111', marginLeft: 8 },
  placeAddress: { fontSize: 13, color: '#777', marginLeft: 30 },
  deleteBtn: { padding: 5 },
  
  transportRow: { paddingLeft: 40, paddingVertical: 15 },
  transportText: { fontSize: 14, color: '#59B5AB', fontWeight: '600' },

  bottomFixedArea: { backgroundColor: '#FFF', paddingBottom: 20, paddingTop: 10 },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#111' },
  llmInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEFEEB', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: '#DCE5B6' },
  llmInput: { flex: 1, fontSize: 15, color: '#333' },
  sendBtn: { marginLeft: 10 },

  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, backgroundColor: '#A9E2D9', borderRadius: 15, paddingVertical: 18, alignItems: 'center' },
  actionBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  saveModalBox: { width: '90%', backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  saveModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  modalBackIcon: { fontSize: 22 },
  saveModalTitle: { fontSize: 16, fontWeight: 'bold' },
  saveSectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  folderTagsRow: { flexDirection: 'row', marginBottom: 25 },
  folderTag: { borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 10, marginRight: 10 },
  folderTagText: { color: '#333' },
  folderTagPlus: { borderWidth: 1, borderColor: '#EEE', borderRadius: 10, width: 40, alignItems: 'center', justifyContent: 'center' },
  saveTitleInput: { backgroundColor: '#FEFEEB', borderRadius: 10, height: 50, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: '#DCE5B6' },
  saveConfirmBtnRow: { alignItems: 'flex-end' },
  saveConfirmBtn: { backgroundColor: '#A9E2D9', borderRadius: 10, padding: 15 },
  saveConfirmBtnText: { fontWeight: 'bold' }
});

export default RouteResultScreen;