import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Animated, Modal, Platform, ToastAndroid, Alert, ActivityIndicator, PanResponder, Keyboard, Share } from 'react-native';
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
import EmptyRouteState from '../components/EmptyRouteState';
import { requestNewRoute, saveItinerary, getRecommendationCache, setRecommendationCache, fetchSegmentRoute } from '../api/routeApi';
import { useRoutes } from '../context/RouteContext';
import WastebasketIcon from '../components/icons/wastebasketIcon';
import MarkerIcon from '../components/icons/markerIcon';
import SendIcon from '../components/icons/sendIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── 색상 매핑 (ODsay 스펙) ───────────────────────────────────────────────
const BUS_TYPE_COLORS = {
  1: '#aa9872',  // 공항버스
  2: '#5BB025',  // 마을버스
  3: '#33CC99',  // 일반/시외
  4: '#0068b7',  // 간선
  5: '#5BB025',  // 지선
  6: '#f99d1c',  // 순환
  10: '#E60012', // 광역
  11: '#0068b7', // 인천버스
  14: '#aa9872', // 관광
  26: '#E60012', // 급행
};

const SUBWAY_COLORS = {
  1: '#0052A4',  // 1호선
  2: '#00A84D',  // 2호선
  3: '#EF7C1C',  // 3호선
  4: '#00A5DE',  // 4호선
  5: '#996CAC',  // 5호선
  6: '#CD7C2F',  // 6호선
  7: '#747F00',  // 7호선
  8: '#E6186C',  // 8호선
  9: '#BDB092',  // 9호선
};

// ── 구간별 색상 유틸 함수 (SubPathRow 카드와 지도 폴리라인 색상을 통일) ──────
function getSubPathColor(trafficType, lane) {
  if (trafficType === 3) return '#888888';  // 도보
  if (trafficType === 2) return BUS_TYPE_COLORS[lane?.[0]?.type] ?? '#0068b7';     // 버스
  if (trafficType === 1) return SUBWAY_COLORS[lane?.[0]?.subwayCode] ?? '#555555'; // 지하철
  return '#43B0AB'; // 기본
}

// ── 이동수단 키 매핑 ──────────────────────────────────────────────────────
const TRANSPORT_TO_KEY = { '도보': 'walk', '자동차': 'drive', '자전거': 'bicycle', '대중교통': 'transit' };
const KEY_TO_TRANSPORT = { walk: '도보', drive: '자동차', bicycle: '자전거', transit: '대중교통' };
const MODE_LABEL = { walk: '🚶 도보', drive: '🚗 자동차', bicycle: '🚴 자전거', transit: '🚌 대중교통' };
const ALL_MODE_KEYS = ['walk', 'drive', 'bicycle', 'transit'];

// ── SubPathRow: 단일 구간 렌더링 ──────────────────────────────────────────
const SubPathRow = ({ sub, isLast }) => {
  const { trafficType, sectionTime, distance, stationCount, startName, endName, way, lane } = sub;

  // 도보 구간
  if (trafficType === 3) {
    return (
      <View style={transitStyles.subPathRow}>
        <View style={transitStyles.iconCol}>
          <View style={[transitStyles.dot, { backgroundColor: '#888' }]} />
          {!isLast && <View style={[transitStyles.connector, { backgroundColor: '#CCC' }]} />}
        </View>
        <View style={transitStyles.subPathContent}>
          <Text style={transitStyles.walkText}>
            🚶 도보 {sectionTime}분{distance ? ` · ${distance}m` : ''}
          </Text>
        </View>
      </View>
    );
  }

  // 버스 구간
  if (trafficType === 2) {
    const laneInfo = lane?.[0];
    const color = getSubPathColor(2, lane); // 유틸 함수로 통일
    const busLabel = laneInfo?.busNo ? `${laneInfo.busNo}번` : '버스';
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
            {sectionTime}분
            {startName && endName ? ` · ${startName} → ${endName}` : ''}
            {stationCount ? ` (${stationCount}정거장)` : ''}
          </Text>
        </View>
      </View>
    );
  }

  // 지하철 구간
  if (trafficType === 1) {
    const laneInfo = lane?.[0];
    const color = getSubPathColor(1, lane); // 유틸 함수로 통일
    const lineName = laneInfo?.name ?? '지하철';
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
            {sectionTime}분
            {startName && endName ? ` · ${startName} → ${endName}` : ''}
            {way ? ` (${way})` : ''}
            {stationCount ? ` · ${stationCount}정거장` : ''}
          </Text>
        </View>
      </View>
    );
  }

  return null;
};

// ── SegmentModeDisplay: 이동수단 표시 + 탭하면 4가지 수단 칩 펼침 ──────────────
const SegmentModeDisplay = ({ routes = {}, currentModeKey, isPickerOpen, onTogglePicker, onSelectMode, loadingModes = new Set() }) => {
  const activeKey = (currentModeKey && routes[currentModeKey] != null) ? currentModeKey
    : ALL_MODE_KEYS.find(k => routes[k] != null) ?? ALL_MODE_KEYS[0];
  const activeRoute = routes[activeKey];

  const renderCurrentMode = () => {
    if (!activeRoute) {
      return (
        <TouchableOpacity style={transitStyles.simpleRow} onPress={onTogglePicker} activeOpacity={0.7}>
          <Text style={[transitStyles.simpleText, { color: '#aaa' }]}>경로 정보 없음</Text>
          <Text style={{ fontSize: 11, color: '#bbb', marginLeft: 4 }}>▾</Text>
        </TouchableOpacity>
      );
    }
    if (activeKey === 'transit' && activeRoute.transit_sub_paths?.length > 0) {
      const { transit_sub_paths = [], transit_payment, transit_total_walk, duration_minutes } = activeRoute;
      return (
        <View style={transitStyles.card}>
          <TouchableOpacity style={transitStyles.summaryRow} onPress={onTogglePicker} activeOpacity={0.7}>
            <Text style={transitStyles.summaryTime}>🚌 대중교통 {Math.round(duration_minutes)}분</Text>
            <View style={transitStyles.summaryMeta}>
              {transit_payment > 0 && <Text style={transitStyles.summaryChip}>{transit_payment.toLocaleString()}원</Text>}
              {transit_total_walk > 0 && <Text style={transitStyles.summaryChip}>도보 {transit_total_walk}m</Text>}
              <Text style={transitStyles.summaryChip}>▾</Text>
            </View>
          </TouchableOpacity>
          {transit_sub_paths.map((sub, i) => (
            <SubPathRow key={i} sub={sub} isLast={i === transit_sub_paths.length - 1} />
          ))}
        </View>
      );
    }
    const distKm = activeRoute.distance_meters >= 1000
      ? `${(activeRoute.distance_meters / 1000).toFixed(1)}km`
      : `${activeRoute.distance_meters}m`;
    return (
      <TouchableOpacity style={transitStyles.simpleRow} onPress={onTogglePicker} activeOpacity={0.7}>
        <Text style={transitStyles.simpleText}>
          {MODE_LABEL[activeKey]} {Math.round(activeRoute.duration_minutes)}분 · {distKm}
        </Text>
        <Text style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>▾</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {renderCurrentMode()}
      {isPickerOpen && (
        <View style={transitStyles.modePicker}>
          {ALL_MODE_KEYS.map(key => {
            const route = routes[key];
            const isLoading = loadingModes.has(key);
            const isActive = key === activeKey;
            const isTransitWithData = key === 'transit' && route?.transit_sub_paths?.length > 0;
            return (
              <View key={key} style={{ width: isTransitWithData ? '100%' : 'auto' }}>
                <TouchableOpacity
                  style={[transitStyles.modeChip, isActive && transitStyles.modeChipActive, isLoading && { opacity: 0.6 }]}
                  onPress={() => onSelectMode(key)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator size="small" color="#43B0AB" style={{ marginBottom: 2 }} />
                      <Text style={[transitStyles.modeChipText, isActive && transitStyles.modeChipTextActive]}>{MODE_LABEL[key]}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[transitStyles.modeChipText, isActive && transitStyles.modeChipTextActive]}>{MODE_LABEL[key]}</Text>
                      {route != null ? (
                        <Text style={[transitStyles.modeChipSub, isActive && { color: '#43B0AB' }]}>
                          {Math.round(route.duration_minutes)}분 · {
                            route.distance_meters >= 1000
                              ? `${(route.distance_meters / 1000).toFixed(1)}km`
                              : `${route.distance_meters}m`
                          }
                        </Text>
                      ) : (
                        <Text style={[transitStyles.modeChipSub, { color: '#bbb' }]}>탭해서 조회</Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
                {/* 대중교통 칩 아래에 SubPathRow 상세 표시 */}
                {isTransitWithData && (
                  <View style={transitStyles.transitChipDetail}>
                    {route.transit_sub_paths.map((sub, i) => (
                      <SubPathRow key={i} sub={sub} isLast={i === route.transit_sub_paths.length - 1} />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const RouteResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { folders, addFolder, setAllRoutes } = useRoutes();

  // 🌟 메모리 캐시에서 가져오기 (Navigation Parameter 크기 초과 방지)
  const cache = getRecommendationCache();
  const apiData = cache.data || (params.response ? JSON.parse(params.response) : null);
  const originalRequest = cache.request || (params.originalRequest ? JSON.parse(params.originalRequest) : null);

  // 장소(places)와 이동수단(route_segments) 추출
  const places = apiData?.places || [];
  const routeSegments = apiData?.route_segments || [];


  // 사용자가 선택한 transports 중 첫 번째를 기본 모드로 사용
  // transit이 포함되어 있으면 transit 우선 (상세 정보 표시를 위해)
  const _selectedKeys = (originalRequest?.transports ?? [])
    .map(t => TRANSPORT_TO_KEY[t]).filter(Boolean);
  const _defaultModeKey = _selectedKeys.includes('transit') ? 'transit'
    : (_selectedKeys[0] ?? 'walk');

  const [segmentModes, setSegmentModes] = useState(() => {
    const modes = {};
    routeSegments.forEach(seg => {
      const avail = Object.keys(seg.routes || {}).filter(k => seg.routes[k] != null);
      modes[seg.from_name] = avail.includes(_defaultModeKey) ? _defaultModeKey : (avail[0] ?? null);
    });
    return modes;
  });
  const [activeModePickerSegment, setActiveModePickerSegment] = useState(null);
  // 온디맨드로 조회한 추가 경로 캐시: { "from_name:mode_key": RouteDetail | null }
  const [extraRoutes, setExtraRoutes] = useState({});
  // 현재 조회 중인 수단: { "from_name:mode_key": true }
  const [loadingSegments, setLoadingSegments] = useState({});

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
  const [isNoRouteModalVisible, setNoRouteModalVisible] = useState(false);

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
        if (isSaveModalVisible || isFolderCreateVisible) return;
        const kbHeight = e.endCoordinates.height;
        heightBeforeKeyboard.current = lastHeight.current;
        
        // 지도를 일정 부분 가리지 않도록 상단 여백 확보 (대략 120px)
        const safeHeight = SCREEN_HEIGHT - kbHeight - 120;
        // 기존 높이가 safeHeight보다 크면 줄여서 키보드+모달이 화면을 꽉 채우지 않게 함
        const targetHeight = Math.min(heightBeforeKeyboard.current, safeHeight);
        
        lastHeight.current = targetHeight;
        
        Animated.parallel([
          Animated.timing(animatedHeight, {
            toValue: targetHeight,
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
        if (isSaveModalVisible || isFolderCreateVisible) return;
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
  }, [isSaveModalVisible, isFolderCreateVisible]);

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
      // 1. 백엔드 schedule 형식 (Day 1, 2, 3 지원)
      const data = {};
      apiData.schedule.forEach(dayInfo => {
        data[dayInfo.day] = dayInfo.places.map((place, index) => {
          const segment = routeSegments.find(seg => seg.from_name === place.name) || null;
          return {
            id: place.id || `${dayInfo.day}-${index}`,
            name: place.name,
            address: place.address || place.description || place.reason,
            transportSegment: segment,
            lat: place.lat || (35.10 + Math.random() * 0.05),
            lng: place.lng || (129.04 + Math.random() * 0.05),
            accessibilityUnconfirmed: place.accessibility_unconfirmed || false,
            petUnconfirmed: place.pet_unconfirmed || false,
          };
        });
      });
      return data;
    } else {
      // 2. 기존 백엔드 API 형식 (places 단일 리스트)
      return {
        1: places.map((place, index) => {
          // segment 객체 자체를 저장 → TransitDetailCard에서 subPath까지 접근 가능
          const segment = routeSegments.find(seg => seg.from_name === place.name) || null;
          return {
            id: index + 1,
            name: place.name,
            address: place.reason,
            transportSegment: segment, // 전체 segment 객체 보관
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

  // 초기 segment.routes + 온디맨드로 조회한 extraRoutes 합산
  const getMergedRoutes = (fromName, originalRoutes) => {
    const extras = {};
    ALL_MODE_KEYS.forEach(key => {
      const cacheKey = `${fromName}:${key}`;
      if (cacheKey in extraRoutes) extras[key] = extraRoutes[cacheKey];
    });
    return { ...originalRoutes, ...extras };
  };

  // 수단 칩 선택: 즉시 화면 전환 + 데이터 없으면 API 호출
  const handleModeSelect = async (fromName, toName, modeKey) => {
    setSegmentModes(prev => ({ ...prev, [fromName]: modeKey }));
    setActiveModePickerSegment(null);

    const cacheKey = `${fromName}:${modeKey}`;
    // 이미 원본 데이터 또는 캐시에 있으면 스킵
    const origSeg = routeSegments.find(s => s.from_name === fromName);
    if (origSeg?.routes?.[modeKey] != null || cacheKey in extraRoutes) return;

    setLoadingSegments(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const allPlaces = Object.values(daysData).flat();
      const origin = allPlaces.find(p => p.name === fromName);
      const dest   = allPlaces.find(p => p.name === toName);
      if (!origin || !dest) throw new Error('장소 좌표 없음');

      const result = await fetchSegmentRoute({
        origin_lat: origin.lat, origin_lng: origin.lng,
        dest_lat:   dest.lat,   dest_lng:   dest.lng,
        transport:  KEY_TO_TRANSPORT[modeKey],
      });
      setExtraRoutes(prev => ({ ...prev, [cacheKey]: result.route }));
    } catch (e) {
      console.warn(`[구간 경로] ${fromName}→${toName} ${modeKey} 조회 실패:`, e.message);
      setExtraRoutes(prev => ({ ...prev, [cacheKey]: null }));
    } finally {
      setLoadingSegments(prev => { const n = { ...prev }; delete n[cacheKey]; return n; });
    }
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
          // 백엔드 원본 segment에서 새 연결 찾기
          const newSegment = routeSegments.find(
            seg => seg.from_name === prevPlace.name && seg.to_name === nextPlace.name
          );
          prevPlace.transportSegment = newSegment || null;
        } else {
          prevPlace.transportSegment = null;
        }
      }

      // 마지막 장소의 transportSegment는 항상 null
      if (newPlaces.length > 0) {
        newPlaces[newPlaces.length - 1].transportSegment = null;
      }

      return { ...prev, [selectedDay]: [...newPlaces] };
    });
  };

  const handleShare = async () => {
    const region = originalRequest?.region || '여행';
    const days = Object.keys(daysData).sort((a, b) => a - b);

    const lines = [`🗺️ ${region} ${days.length}일 여행 경로`, ''];
    days.forEach(day => {
      lines.push(`[ ${day}일차 ]`);
      (daysData[day] || []).forEach((place, i) => {
        lines.push(`  ${i + 1}. ${place.name}`);
        if (place.address) lines.push(`     ${place.address}`);
      });
      lines.push('');
    });
    lines.push('GONYADI 앱으로 만든 여행 경로입니다.');

    try {
      await Share.share({ message: lines.join('\n') });
    } catch (e) {
      Alert.alert('공유 실패', e.message);
    }
  };

  // 수정사항 전송 (재추천 요청)
  const handleModifySubmit = async () => {
    if (!modifyText.trim()) {
      Alert.alert('안내', '수정사항을 입력해주세요.');
      return;
    }

    const allCurrentPlaces = Object.values(daysData).flat();
    if (allCurrentPlaces.length === 0) {
      setNoRouteModalVisible(true);
      return;
    }

    setIsModifying(true);
    try {
      const { requestNewRoute } = require('../api/routeApi');

      // 현재 화면의 장소 목록 (삭제 반영된 상태)을 전달
      const placesForApi = allCurrentPlaces.map(p => ({
        name: p.name,
        lat: p.lat ?? 0,
        lng: p.lng ?? 0,
        reason: p.address || p.name,
        duration: 60,
        category: '관광',
      }));

      // 사용자 메시지에서 테마 키워드를 감지해 원본 테마와 합산
      const ALL_THEMES = ['힐링', '맛집', '카페', '사진', '전시', '체험', '쇼핑', '역사', '문화', '축제', '자연', '오락', '레저'];
      const detectedThemes = ALL_THEMES.filter(t => modifyText.includes(t));
      const baseThemes = originalRequest?.themes ?? ['힐링'];
      const mergedThemes = [...new Set([...baseThemes, ...detectedThemes])];

      const modifyData = {
        region: originalRequest?.region || '알 수 없음',
        nights: originalRequest?.nights ?? 1,
        days: originalRequest?.days ?? 2,
        number_of_people: originalRequest?.number_of_people ?? 2,
        transports: originalRequest?.transports ?? ['도보'],
        themes: mergedThemes,
        conditions: originalRequest?.conditions ?? [],
        start_date: originalRequest?.start_date ?? undefined,
        end_date: originalRequest?.end_date ?? undefined,
        user_message: modifyText,
        original_places: placesForApi,
      };

      console.log('[수정 요청] Payload:', JSON.stringify(modifyData));
      const data = await requestNewRoute(modifyData);

      setRecommendationCache(data, modifyData);
      router.replace('/route-result');
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
        nights: originalRequest?.nights ?? null,
        days: originalRequest?.days || 2,
        number_of_people: originalRequest?.number_of_people ?? 2,
        budget_per_person: originalRequest?.budget_per_person ?? null,
        start_date: originalRequest?.start_date ?? null,
        end_date: originalRequest?.end_date ?? null,
        recommendation_data: { ...apiData, _request: originalRequest },
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

  // ── 구간별 색상 폴리라인 목록 계산 (segmentModes + extraRoutes 반영) ──────────
  const coloredPolylines = routeSegments.flatMap(seg => {
    if (!activeNames.has(seg.from_name) || !activeNames.has(seg.to_name)) return [];

    const merged  = getMergedRoutes(seg.from_name, seg.routes ?? {});
    const modeKey = segmentModes[seg.from_name]
      ?? ALL_MODE_KEYS.find(k => merged[k] != null);
    if (!modeKey) return [];

    const route = merged[modeKey];
    if (!route) return [];

    // 대중교통: subPath별 분리 색상
    if (modeKey === 'transit' && route.transit_sub_paths?.length > 0) {
      return route.transit_sub_paths
        .filter(sub => sub.polyline?.length >= 2)
        .map(sub => ({
          coords: sub.polyline.map(c => ({ latitude: c[0], longitude: c[1] })),
          color:  getSubPathColor(sub.trafficType, sub.lane),
          isDash: sub.trafficType === 3,
          width:  sub.trafficType === 3 ? 4 : 5,
        }));
    }

    // 도보/자동차/자전거: 단색
    if (!route.polyline?.length) return [];
    const modeColor = modeKey === 'walk'    ? '#888888'
                    : modeKey === 'drive'   ? '#E07B39'
                    : modeKey === 'bicycle' ? '#5BB025'
                    : '#43B0AB';
    return [{
      coords: route.polyline.map(c => ({ latitude: c[0], longitude: c[1] })),
      color:  modeColor,
      isDash: modeKey === 'walk',
      width:  4,
    }];
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

  // 지도 자동 영역 맞춤 (모달 상단 공간에 전체 경로 표시)
  useEffect(() => {
    if (mapRef.current && isMapAvailable && activePlaces.length > 0) {
      const coords = activePlaces.map(p => ({ latitude: p.lat, longitude: p.lng }));
      
      // 모달이 바닥에서 MID_HEIGHT (약 55%) 정도를 차지하므로, 바텀 패딩을 모달 높이 + 여유공간으로 줍니다.
      const bottomPadding = SCREEN_HEIGHT * 0.55 + 20; 
      
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(coords, {
            edgePadding: { top: 100, right: 60, bottom: bottomPadding, left: 60 },
            animated: true,
          });
        }
      }, 500);
    }
  }, [activePlaces, selectedDay]);

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
            {/* 구간별 색상 폴리라인: 대중교통=호선색, 도보=회색점선, 자동차=주황 */}
            {coloredPolylines.map((pl, i) => {
              const startCoord = pl.coords?.[0];
              const stableKey = `pl-${pl.color}-${pl.isDash ? 1 : 0}-${startCoord?.latitude?.toFixed(5)}-${startCoord?.longitude?.toFixed(5)}`;
              return (
                <Polyline
                  key={stableKey}
                  coordinates={pl.coords}
                  strokeColor={pl.color}
                  strokeWidth={pl.width}
                  lineDashPattern={pl.isDash ? [6, 4] : undefined}
                />
              );
            })}
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
                      {place.accessibilityUnconfirmed && (
                        <Text style={styles.accessibilityWarning}>⚠ 접근성 미확인</Text>
                      )}
                      {place.petUnconfirmed && (
                        <Text style={styles.accessibilityWarning}>⚠ 반려동물 동반 가능 여부 미확인</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePlace(place.id)}>
                      <WastebasketIcon width={20} height={20} color="#A9E2D9" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* 이동 수단 정보 — 터치하면 4가지 수단 선택 가능 */}
                  {place.transportSegment && (() => {
                    const fromName = place.transportSegment.from_name;
                    const toName   = place.transportSegment.to_name;
                    const merged   = getMergedRoutes(fromName, place.transportSegment.routes ?? {});
                    const loadingSet = new Set(
                      ALL_MODE_KEYS.filter(k => loadingSegments[`${fromName}:${k}`])
                    );
                    return (
                      <View style={styles.transportRow}>
                        <SegmentModeDisplay
                          routes={merged}
                          currentModeKey={segmentModes[fromName]}
                          isPickerOpen={activeModePickerSegment === fromName}
                          onTogglePicker={() => setActiveModePickerSegment(prev =>
                            prev === fromName ? null : fromName
                          )}
                          onSelectMode={(key) => handleModeSelect(fromName, toName, key)}
                          loadingModes={loadingSet}
                        />
                      </View>
                    );
                  })()}
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
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionBtnText}>공유하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={() => setSaveModalVisible(true)}>
              <Text style={styles.actionBtnText}>저장하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        </Animated.View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isSaveModalVisible && !isFolderCreateVisible}
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

      {/* 경로 없음 안내 팝업 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isNoRouteModalVisible}
        onRequestClose={() => setNoRouteModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNoRouteModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.saveModalBox}>
            <Text style={styles.noRouteModalTitle}>경로 없음</Text>
            <Text style={styles.noRouteModalMessage}>
              수정할 경로가 없습니다.{'\n'}장소를 먼저 추가하거나 새로운 경로를 추천받아주세요.
            </Text>
            <TouchableOpacity
              style={styles.noRouteModalBtn}
              onPress={() => setNoRouteModalVisible(false)}
            >
              <Text style={styles.noRouteModalBtnText}>확인</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  accessibilityWarning: { fontSize: 11, color: '#E07B39', marginLeft: 30, marginTop: 3 },
  deleteBtn: { padding: 5 },
  
  transportRow: { paddingLeft: 16, paddingVertical: 8 },
  saveBtn: { backgroundColor: '#59B5AB' },

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
  saveConfirmBtnText: { fontWeight: 'bold' },
  noRouteModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12, textAlign: 'center' },
  noRouteModalMessage: { fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  noRouteModalBtn: { backgroundColor: '#A9E2D9', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  noRouteModalBtnText: { fontSize: 15, fontWeight: 'bold', color: '#111' },
});

// ── 대중교통 상세 카드 전용 스타일 ────────────────────────────────────────
const transitStyles = StyleSheet.create({
  // 대중교통 카드 전체 래퍼
  card: {
    backgroundColor: '#F7FBFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDE8F5',
    marginTop: 4,
  },
  // 요약 헤더 (총 OO분 | 요금 | 도보)
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A6EB5',
  },
  summaryMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  summaryChip: {
    fontSize: 11,
    color: '#555',
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  // 구간 행 (아이콘 + 내용)
  subPathRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  iconCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 8,
    paddingTop: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 2,
    minHeight: 18,
  },
  subPathContent: {
    flex: 1,
    paddingBottom: 10,
  },
  // 도보 텍스트
  walkText: {
    fontSize: 12,
    color: '#777',
    marginTop: 0,
  },
  // 버스/지하철 배지
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
  },
  // 배지 아래 상세 텍스트
  subPathDetail: {
    fontSize: 11,
    color: '#555',
  },
  // 대중교통 없을 때 단순 표시
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  simpleText: {
    fontSize: 13,
    color: '#59B5AB',
    fontWeight: '600',
  },
  // 수단 선택 칩 영역
  modePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F0FAF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C9ECE6',
  },
  modeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  modeChipActive: {
    borderColor: '#43B0AB',
    backgroundColor: '#E0F7F5',
  },
  modeChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  modeChipSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  modeChipTextActive: {
    color: '#43B0AB',
    fontWeight: 'bold',
  },
  // 피커 안 transit 칩 아래 SubPathRow 영역
  transitChipDetail: {
    marginTop: 6,
    paddingLeft: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#C9ECE6',
  },
});

export default RouteResultScreen;