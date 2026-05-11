import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Animated, Modal, Platform, Alert, ActivityIndicator, PanResponder, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { getItineraryDetail, requestNewRoute, saveItinerary } from '../api/routeApi';
import { useRoutes } from '../context/RouteContext';

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

// ── 색상 매핑 (ODsay 스펙) ───────────────────────────────────────────────
const BUS_TYPE_COLORS = {
  1: '#aa9872', 2: '#5BB025', 3: '#33CC99', 4: '#0068b7',
  5: '#5BB025', 6: '#f99d1c', 10: '#E60012', 11: '#0068b7',
  14: '#aa9872', 26: '#E60012',
};
const SUBWAY_COLORS = {
  1: '#0052A4', 2: '#00A84D', 3: '#EF7C1C', 4: '#00A5DE',
  5: '#996CAC', 6: '#CD7C2F', 7: '#747F00', 8: '#E6186C', 9: '#BDB092',
};

function getSubPathColor(trafficType, lane) {
  if (trafficType === 3) return '#888888';
  if (trafficType === 2) return BUS_TYPE_COLORS[lane?.[0]?.type] ?? '#0068b7';
  if (trafficType === 1) return SUBWAY_COLORS[lane?.[0]?.subwayCode] ?? '#555555';
  return '#43B0AB';
}

const SubPathRow = ({ sub, isLast }) => {
  const { trafficType, sectionTime, distance, stationCount, startName, endName, way, lane } = sub;
  if (trafficType === 3) {
    return (
      <View style={transitStyles.subPathRow}>
        <View style={transitStyles.iconCol}>
          <View style={[transitStyles.dot, { backgroundColor: '#888' }]} />
          {!isLast && <View style={[transitStyles.connector, { backgroundColor: '#CCC' }]} />}
        </View>
        <View style={transitStyles.subPathContent}>
          <Text style={transitStyles.walkText}>🚶 도보 {sectionTime}분{distance ? ` · ${distance}m` : ''}</Text>
        </View>
      </View>
    );
  }
  if (trafficType === 2) {
    const color = getSubPathColor(2, lane);
    const busLabel = lane?.[0]?.busNo ? `${lane[0].busNo}번` : '버스';
    return (
      <View style={transitStyles.subPathRow}>
        <View style={transitStyles.iconCol}>
          <View style={[transitStyles.dot, { backgroundColor: color }]} />
          {!isLast && <View style={[transitStyles.connector, { backgroundColor: color, opacity: 0.4 }]} />}
        </View>
        <View style={transitStyles.subPathContent}>
          <View style={[transitStyles.badge, { backgroundColor: color }]}>
            <Text style={transitStyles.badgeText}>🚌 {busLabel}</Text>
          </View>
          <Text style={transitStyles.subPathDetail}>
            {sectionTime}분{startName && endName ? ` · ${startName} → ${endName}` : ''}{stationCount ? ` (${stationCount}정거장)` : ''}
          </Text>
        </View>
      </View>
    );
  }
  if (trafficType === 1) {
    const color = getSubPathColor(1, lane);
    const lineName = lane?.[0]?.name ?? '지하철';
    return (
      <View style={transitStyles.subPathRow}>
        <View style={transitStyles.iconCol}>
          <View style={[transitStyles.dot, { backgroundColor: color }]} />
          {!isLast && <View style={[transitStyles.connector, { backgroundColor: color, opacity: 0.4 }]} />}
        </View>
        <View style={transitStyles.subPathContent}>
          <View style={[transitStyles.badge, { backgroundColor: color }]}>
            <Text style={transitStyles.badgeText}>🚇 {lineName}</Text>
          </View>
          <Text style={transitStyles.subPathDetail}>
            {sectionTime}분{startName && endName ? ` · ${startName} → ${endName}` : ''}{way ? ` (${way})` : ''}{stationCount ? ` · ${stationCount}정거장` : ''}
          </Text>
        </View>
      </View>
    );
  }
  return null;
};

const TransitDetailCard = ({ segment }) => {
  const transitRoute = segment?.routes?.transit;
  if (!transitRoute) {
    const mode = segment?.routes ? Object.keys(segment.routes)[0] : null;
    const route = mode ? segment.routes[mode] : null;
    if (!route) return null;
    const label = mode === 'walk' ? '🚶 도보' : mode === 'drive' ? '🚗 자동차' : mode === 'bicycle' ? '🚴 자전거' : mode;
    return (
      <View style={transitStyles.simpleRow}>
        <Text style={transitStyles.simpleText}>{label} {Math.round(route.duration_minutes)}분 · {route.distance_meters}m</Text>
      </View>
    );
  }
  const { transit_sub_paths = [], transit_payment, transit_total_walk, duration_minutes } = transitRoute;
  return (
    <View style={transitStyles.card}>
      <View style={transitStyles.summaryRow}>
        <Text style={transitStyles.summaryTime}>🚌 대중교통 {Math.round(duration_minutes)}분</Text>
        <View style={transitStyles.summaryMeta}>
          {transit_payment > 0 && <Text style={transitStyles.summaryChip}>{transit_payment.toLocaleString()}원</Text>}
          {transit_total_walk > 0 && <Text style={transitStyles.summaryChip}>도보 {transit_total_walk}m</Text>}
        </View>
      </View>
      {transit_sub_paths.map((sub, i) => (
        <SubPathRow key={i} sub={sub} isLast={i === transit_sub_paths.length - 1} />
      ))}
    </View>
  );
};

import FolderCreateModal from '../components/FolderCreateModal';
import StarIcon from '../components/icons/starIcon';
import WastebasketIcon from '../components/icons/wastebasketIcon';
import MarkerIcon from '../components/icons/markerIcon';
import SendIcon from '../components/icons/sendIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SavedRouteDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { folders, allRoutes, addFolder, setAllRoutes } = useRoutes();
  
  // 데이터 관련 상태
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);
  const [daysData, setDaysData] = useState({});
  
  // UI 관련 상태
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [modifyText, setModifyText] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [isSaveModalVisible, setSaveModalVisible] = useState(false);
  const [isFolderCreateVisible, setFolderCreateVisible] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); // 로컬 UI 반영용 (선택사항)

  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);
  const placeRefs = useRef({});

  // 애니메이션 관련
  const animatedHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.55)).current;
  const animatedBottom = useRef(new Animated.Value(0)).current;
  const lastHeight = useRef(SCREEN_HEIGHT * 0.55);
  const heightBeforeKeyboard = useRef(SCREEN_HEIGHT * 0.55);

  const MIN_HEIGHT = SCREEN_HEIGHT * 0.30;
  const MID_HEIGHT = SCREEN_HEIGHT * 0.55;
  const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;

  // 데이터 로드 - API 호출로 복구
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        // 🌟 백엔드 상세 조회 API 호출
        const data = await getItineraryDetail(id);
        
        if (data) {
          setItinerary({
            title: data.title,
            region: data.region,
            days: data.days,
            folder_id: data.folder_id,
          });
          
          // API 응답 데이터 (추천 결과 본체) 설정
          const apiResponse = data.recommendation_data || data;
          setApiData(apiResponse);
          processDaysData(apiResponse);
          setSaveTitle(data.title);
        }
      } catch (error) {
        console.error('[상세 조회 실패]', error);
        
        // 🌟 서버 실패 시 Context에서 찾아보기 (오프라인 폴백)
        const localRoute = allRoutes.find(r => String(r.id) === String(id));
        if (localRoute) {
          setItinerary({
            title: localRoute.title,
            region: localRoute.location,
            days: localRoute.days,
            folder_id: null,
          });
          const apiResponse = localRoute.recommendation_data || localRoute;
          setApiData(apiResponse);
          processDaysData(apiResponse);
          setSaveTitle(localRoute.title);
        } else {
          Alert.alert('에러', '일정 정보를 불러오는데 실패했습니다.');
          router.back();
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id, allRoutes]);

  // daysData 변환 로직
  const processDaysData = (data) => {
    const routeSegs = data?.route_segments || [];

    if (data?.schedule) {
      const processed = {};
      data.schedule.forEach(dayInfo => {
        processed[dayInfo.day] = dayInfo.places.map((place, index) => {
          const segment = routeSegs.find(seg => seg.from_name === place.name) || null;
          return {
            id: place.id || `${dayInfo.day}-${index}`,
            name: place.name,
            address: place.address || place.description || place.reason,
            transportSegment: segment,
            lat: place.lat || (35.10 + Math.random() * 0.05),
            lng: place.lng || (129.04 + Math.random() * 0.05)
          };
        });
      });
      setDaysData(processed);
    } else {
      const places = data?.places || [];
      const processed = {
        1: places.map((place, index) => {
          const segment = routeSegs.find(seg => seg.from_name === place.name) || null;
          return {
            id: index + 1,
            name: place.name,
            address: place.reason,
            transportSegment: segment,
            lat: place.lat,
            lng: place.lng
          };
        })
      };
      setDaysData(processed);
    }
  };

  // 키보드 처리
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const kbHeight = e.endCoordinates.height;
        heightBeforeKeyboard.current = lastHeight.current;
        lastHeight.current = MAX_HEIGHT;
        Animated.parallel([
          Animated.timing(animatedHeight, { toValue: MAX_HEIGHT, duration: 250, useNativeDriver: false }),
          Animated.timing(animatedBottom, { toValue: kbHeight, duration: 250, useNativeDriver: false }),
        ]).start();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        const restoreHeight = heightBeforeKeyboard.current;
        lastHeight.current = restoreHeight;
        Animated.parallel([
          Animated.timing(animatedHeight, { toValue: restoreHeight, duration: 250, useNativeDriver: false }),
          Animated.timing(animatedBottom, { toValue: 0, duration: 250, useNativeDriver: false }),
        ]).start();
      }
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = lastHeight.current - gestureState.dy;
        const clampedHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
        animatedHeight.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentHeight = lastHeight.current - gestureState.dy;
        const snapPoints = [MIN_HEIGHT, MID_HEIGHT, MAX_HEIGHT];
        let target = MID_HEIGHT;
        let minDist = Infinity;
        for (const point of snapPoints) {
          const dist = Math.abs(currentHeight - point);
          if (dist < minDist) { minDist = dist; target = point; }
        }
        if (Math.abs(gestureState.vy) > 0.5) {
          target = gestureState.dy > 0 ? MIN_HEIGHT : MAX_HEIGHT;
        }
        lastHeight.current = target;
        Animated.spring(animatedHeight, { toValue: target, useNativeDriver: false, bounciness: 4 }).start();
      },
    })
  ).current;

  // 장소 삭제
  const handleDeletePlace = (placeId) => {
    setDaysData(prev => {
      const currentPlaces = prev[selectedDay] || [];
      const newPlaces = currentPlaces.filter(p => p.id !== placeId);
      // 이동 수단 재계산 로직 생략(간소화) 또는 복사
      return { ...prev, [selectedDay]: newPlaces };
    });
  };

  // 수정 요청
  const handleModifySubmit = async () => {
    if (!modifyText.trim()) return;
    setIsModifying(true);
    try {
      const currentPlaces = daysData[selectedDay] || [];
      const placesForApi = currentPlaces.map(p => ({
        name: p.name, lat: p.lat, lng: p.lng, reason: p.address, duration: 60, category: '관광',
      }));
      const modifyData = {
        region: itinerary.region,
        user_message: modifyText,
        original_places: placesForApi,
      };
      const data = await requestNewRoute(modifyData);
      setApiData(data);
      processDaysData(data);
      Alert.alert('성공', '경로가 수정되었습니다.');
    } catch (error) {
      Alert.alert('에러', '수정 요청에 실패했습니다.');
    } finally {
      setIsModifying(false);
      setModifyText('');
    }
  };

  const handleCreateFolder = (name) => {
    addFolder(name);
    Alert.alert('알림', '폴더가 생성되었습니다.');
  };

  const handleSaveItinerary = () => {
    setIsSaving(true);
    try {
      // 선택된 폴더 이름 찾기
      const folder = folders.find(f => f.folder_pk === selectedFolderId);
      const folderName = folder ? folder.name : '국내';

      const newSavedRoute = {
        id: Date.now(),
        category: folderName,
        title: saveTitle || itinerary.title,
        location: itinerary.region,
        date: new Date().toISOString().split('T')[0],
        days: itinerary.days,
        isFavorite: false,
        recommendation_data: apiData
      };

      // Context의 전역 상태 업데이트 (저장된 경로 목록에 추가)
      setAllRoutes(prev => [...prev, newSavedRoute]);

      Alert.alert('성공', '경로가 저장되었습니다.');
      setSaveModalVisible(false);
      // 저장 후 목록 화면으로 이동하거나 유도 가능
    } catch (e) {
      Alert.alert('에러', '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#43B0AB" /></View>;
  }

  const activePlaces = daysData[selectedDay] || [];
  const activeNames = new Set(activePlaces.map(p => p.name));
  const routeSegments = apiData?.route_segments || [];
  const coloredPolylines = routeSegments.flatMap(seg => {
    if (!seg.routes) return [];
    if (!activeNames.has(seg.from_name) || !activeNames.has(seg.to_name)) return [];

    const transitRoute = seg.routes?.transit;
    if (transitRoute?.transit_sub_paths?.length > 0) {
      return transitRoute.transit_sub_paths
        .filter(sub => sub.polyline?.length >= 2)
        .map(sub => ({
          coords: sub.polyline.map(c => ({ latitude: c[0], longitude: c[1] })),
          color: getSubPathColor(sub.trafficType, sub.lane),
          isDash: sub.trafficType === 3,
          width: sub.trafficType === 3 ? 4 : 5,
        }));
    }

    const mode = Object.keys(seg.routes)[0];
    const route = mode ? seg.routes[mode] : null;
    if (!route?.polyline?.length) return [];
    const modeColor = mode === 'walk' ? '#888888' : mode === 'drive' ? '#E07B39' : mode === 'bicycle' ? '#5BB025' : '#43B0AB';
    return [{
      coords: route.polyline.map(c => ({ latitude: c[0], longitude: c[1] })),
      color: modeColor,
      isDash: mode === 'walk',
      width: 4,
    }];
  });

  const initialRegion = activePlaces.length > 0 ? {
    latitude: activePlaces[0].lat, longitude: activePlaces[0].lng, latitudeDelta: 0.05, longitudeDelta: 0.05,
  } : { latitude: 35.8714354, longitude: 128.601445, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      


      <View style={styles.mapArea}>
        {isMapAvailable ? (
          <MapView ref={mapRef} style={StyleSheet.absoluteFillObject} initialRegion={initialRegion}>
            {activePlaces.map((place, index) => (
              <Marker
                key={`marker-${place.id}`}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                title={`${index + 1}. ${place.name}`}
                pinColor={selectedPlaceId === place.id ? '#43B0AB' : 'red'}
                onPress={() => {
                  setSelectedPlaceId(place.id);
                  placeRefs.current[place.id]?.measureLayout(scrollViewRef.current, (x, y) => {
                    scrollViewRef.current?.scrollTo({ y: y - 10, animated: true });
                  });
                }}
              />
            ))}
            {coloredPolylines.map((pl, i) => (
              <Polyline
                key={`pl-${i}`}
                coordinates={pl.coords}
                strokeColor={pl.color}
                strokeWidth={pl.width}
                lineDashPattern={pl.isDash ? [6, 4] : undefined}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}><Text>🗺️ 지도 영역</Text></View>
        )}
        <TouchableOpacity onPress={() => router.back()} style={styles.mapBackButton}><Text style={styles.mapBackIcon}>←</Text></TouchableOpacity>
      </View>

      <Animated.View style={[styles.bottomSheet, { height: animatedHeight, bottom: animatedBottom }]}>
        <View {...panResponder.panHandlers} style={styles.handleWrapper}><View style={styles.dragHandle} /></View>
        <View style={styles.dayTabRow}>
          {Object.keys(daysData).sort((a, b) => a - b).map(day => (
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
            <View style={styles.mainVerticalLine} />
            <View style={{ flex: 1 }}>
              {activePlaces.map((place, index) => (
                <View key={place.id} style={styles.placeItemWrapper} ref={ref => { placeRefs.current[place.id] = ref; }}>
                  <TouchableOpacity 
                    style={[styles.placeCard, selectedPlaceId === place.id && styles.placeCardSelected]}
                    onPress={() => {
                      setSelectedPlaceId(place.id);
                      mapRef.current?.animateToRegion({ latitude: place.lat - 0.004, longitude: place.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
                    }}
                  >
                    <View style={styles.placeInfo}>
                      <View style={styles.placeNameRow}>
                        <MarkerIcon width={22} height={22} color={selectedPlaceId === place.id ? '#43B0AB' : '#111'} />
                        <Text style={[styles.placeNameText, selectedPlaceId === place.id && { color: '#43B0AB' }]}>{place.name}</Text>
                      </View>
                      <Text style={styles.placeAddress}>{place.address}</Text>
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePlace(place.id)}><WastebasketIcon width={20} height={20} color="#A9E2D9" /></TouchableOpacity>
                  </TouchableOpacity>
                  {place.transportSegment && (
                    <View style={styles.transportRow}>
                      <TransitDetailCard segment={place.transportSegment} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.bottomFixedArea}>
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>수정사항을 입력하세요</Text>
            <View style={styles.llmInputWrapper}>
              <TextInput style={styles.llmInput} placeholder="조금 더 힐링 목적에 맞게 수정해줘" value={modifyText} onChangeText={setModifyText} editable={!isModifying} />
              <TouchableOpacity style={styles.sendBtn} onPress={handleModifySubmit} disabled={isModifying}>
                {isModifying ? <ActivityIndicator size="small" color="#59B5AB" /> : <SendIcon width={20} height={20} color="#666" />}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>공유하기</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={() => setSaveModalVisible(true)}><Text style={styles.actionBtnText}>저장하기</Text></TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Modal animationType="fade" transparent={true} visible={isSaveModalVisible} onRequestClose={() => setSaveModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSaveModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.saveModalBox}>
            <View style={styles.saveModalHeader}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={styles.modalBackBtn}><Text style={styles.modalBackIcon}>←</Text></TouchableOpacity>
              <Text style={styles.saveModalTitle}>경로를 저장하시겠습니까?</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView horizontal style={styles.folderTagsRow}>
              {folders.map(f => (
                <TouchableOpacity key={f.folder_pk} style={[styles.folderTag, selectedFolderId === f.folder_pk && styles.activeFolderTag]} onPress={() => setSelectedFolderId(f.folder_pk)}>
                  <Text style={[styles.folderTagText, selectedFolderId === f.folder_pk && styles.activeFolderTagText]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.folderTagPlus} onPress={() => setFolderCreateVisible(true)}><Text>+</Text></TouchableOpacity>
            </ScrollView>
            <TextInput style={styles.saveTitleInput} value={saveTitle} onChangeText={setSaveTitle} />
            <TouchableOpacity style={styles.saveConfirmBtn} onPress={handleSaveItinerary} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.saveConfirmBtnText}>저장하기</Text>}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <FolderCreateModal visible={isFolderCreateVisible} onClose={() => setFolderCreateVisible(false)} onSubmit={handleCreateFolder} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  customHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerBackIcon: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  mapArea: { flex: 1, backgroundColor: '#EAF3FA', position: 'relative' },
  mapBackButton: { position: 'absolute', top: 20, left: 20, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.8)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mapBackIcon: { fontSize: 24, color: '#000' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  placeCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 25, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4, borderWidth: 2, borderColor: 'transparent' },
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
  saveModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  saveModalTitle: { fontSize: 16, fontWeight: 'bold' },
  folderTagsRow: { flexDirection: 'row', marginBottom: 20 },
  folderTag: { padding: 10, borderWidth: 1, borderColor: '#EEE', borderRadius: 10, marginRight: 10 },
  activeFolderTag: { borderColor: '#43B0AB', backgroundColor: '#F0FAF9' },
  folderTagText: { color: '#333' },
  activeFolderTagText: { color: '#43B0AB', fontWeight: 'bold' },
  folderTagPlus: { padding: 10, borderWidth: 1, borderColor: '#EEE', borderRadius: 10, width: 40, alignItems: 'center' },
  saveTitleInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 10, marginBottom: 20 },
  saveConfirmBtn: { backgroundColor: '#A9E2D9', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveConfirmBtnText: { fontWeight: 'bold' }
});

export default SavedRouteDetailScreen;

const transitStyles = StyleSheet.create({
  card: { backgroundColor: '#F7FBFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#DDE8F5', marginTop: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  summaryTime: { fontSize: 13, fontWeight: '700', color: '#1A6EB5' },
  summaryMeta: { flexDirection: 'row', gap: 6 },
  summaryChip: { fontSize: 11, color: '#555', backgroundColor: '#E8F0FE', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  subPathRow: { flexDirection: 'row', marginBottom: 2 },
  iconCol: { alignItems: 'center', width: 20, marginRight: 8, paddingTop: 3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  connector: { width: 2, flex: 1, marginTop: 2, minHeight: 18 },
  subPathContent: { flex: 1, paddingBottom: 10 },
  walkText: { fontSize: 12, color: '#777', marginTop: 0 },
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 2 },
  badgeText: { fontSize: 12, color: '#FFF', fontWeight: '700' },
  subPathDetail: { fontSize: 11, color: '#555' },
  simpleRow: { paddingVertical: 4 },
  simpleText: { fontSize: 13, color: '#59B5AB', fontWeight: '600' },
});