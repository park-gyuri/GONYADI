import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import FolderCreateModal from '../components/FolderCreateModal';
import FileIcon from '../components/icons/fileIcon';
import GrayMarkerIcon from '../components/icons/graymarkerIcon';
import StarIcon from '../components/icons/starIcon';
import { useRoutes } from '../context/RouteContext';
import { fetchFolders, createFolder, fetchAllItineraries } from '../api/saveApi';

const RouteScreen = () => {
  const router = useRouter();

  // 폴더 관련 상태 (백엔드 연동)
  const [folders, setFolders] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // 선택된 folder_pk
  const [activeTabName, setActiveTabName] = useState('국내');

  // 저장된 일정 목록 (백엔드 연동)
  const [itineraries, setItineraries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모달 제어 상태
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [isOptionVisible, setOptionVisible] = useState(false);

  // 🌟 전역 Context에서 데이터 가져오기!!
  const { toggleFavorite } = useRoutes();

  // 화면에 진입할 때마다 백엔드에서 폴더 + 일정 데이터를 불러옴
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [foldersData, itinerariesData] = await Promise.all([
        fetchFolders(),
        fetchAllItineraries()
      ]);
      setFolders(foldersData);
      setItineraries(itinerariesData);

      // 첫 번째 폴더를 기본 활성 탭으로 설정
      if (foldersData.length > 0 && activeTab === null) {
        setActiveTab(foldersData[0].folder_pk);
        setActiveTabName(foldersData[0].name);
      }
    } catch (error) {
      console.error('[RouteScreen] 데이터 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 선택된 폴더에 속한 일정만 필터링
  const filteredItineraries = itineraries.filter(it => it.folder_id === activeTab);

  // 폴더 생성 처리
  const handleSubmitFolder = async (name) => {
    try {
      const newFolder = await createFolder(name);
      setFolders([...folders, newFolder]);
      setActiveTab(newFolder.folder_pk);
      setActiveTabName(newFolder.name);
    } catch (error) {
      Alert.alert('오류', '폴더 생성에 실패했습니다.');
    }
    setModalVisible(false);
  };

  // 폴더 삭제 처리
  const handleDeleteFolder = () => {
    const folder = folders.find(f => f.folder_pk === activeTab);
    if (folder && (folder.name === '국내' || folder.name === '해외')) {
      Alert.alert("알림", "기본 폴더는 삭제할 수 없습니다.");
      setOptionVisible(false);
      return;
    }
    Alert.alert("폴더 삭제", `'${selectedFolder}' 폴더를 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive", onPress: () => {
          // TODO: 백엔드 삭제 API 연동 시 여기에 추가
          setFolders(folders.filter(f => f.name !== selectedFolder));
          if (folders.length > 0) {
            setActiveTab(folders[0].folder_pk);
            setActiveTabName(folders[0].name);
          }
          setOptionVisible(false);
        }
      }
    ]);
  };

  // 날짜 포맷 헬퍼
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>여행 경로</Text></View>

      {/* 📂 상단 폴더 탭 영역 */}
      <View style={styles.tabContainer}>
        {folders.map((folder) => (
          <TouchableOpacity
            key={folder.folder_pk}
            style={[styles.tabButton, activeTab === folder.folder_pk && styles.activeTabButton]}
            onPress={() => { setActiveTab(folder.folder_pk); setActiveTabName(folder.name); }}
            onLongPress={() => { setSelectedFolder(folder.name); setOptionVisible(true); }}
          >
            <Text style={[styles.tabText, activeTab === folder.folder_pk && styles.activeTabText]}>{folder.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.plusButton} onPress={() => { setModalMode('create'); setModalVisible(true); }}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 📍 저장된 경로 리스트 영역 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#A9E2D9" />
            <Text style={{ marginTop: 12, color: '#999' }}>불러오는 중...</Text>
          </View>
        ) : filteredItineraries.length > 0 ? (
          filteredItineraries.map((itinerary) => (
            <TouchableOpacity
              key={itinerary.itinerary_pk}
              style={styles.routeCard}
              onPress={() => router.push({ 
                pathname: '/saved-route-detail', 
                params: { 
                  id: itinerary.itinerary_pk, 
                  title: itinerary.title 
                } 
              })}
            >
              <View style={styles.iconBox}>
                <FileIcon width={24} height={24} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeTitle}>{itinerary.title}</Text>
                <View style={styles.routeDetailsRow}>
                  <GrayMarkerIcon width={14} height={14} style={{ marginRight: 4 }} />
                  <Text style={styles.routeDetails}>
                    {itinerary.region} | {formatDate(itinerary.start_date) || formatDate(itinerary.created_at?.substring(0, 10))}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>'{activeTabName}' 폴더에 저장된 경로가 없습니다.</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 팝업 모달들 */}
      <FolderCreateModal
        visible={isModalVisible}
        mode={modalMode}
        initialValue={modalMode === 'edit' ? selectedFolder : ''}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitFolder}
      />

      <Modal visible={isOptionVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.optionOverlay} onPress={() => setOptionVisible(false)}>
          <View style={styles.optionBox}>
            <Text style={styles.optionTitle}>폴더 관리: {selectedFolder}</Text>
            <TouchableOpacity style={styles.optionBtn} onPress={() => { setOptionVisible(false); setModalMode('edit'); setModalVisible(true); }}>
              <Text style={styles.optionBtnText}>이름 수정하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionBtn} onPress={handleDeleteFolder}>
              <Text style={[styles.optionBtnText, { color: '#E57373' }]}>폴더 삭제하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#C4CCD8', marginRight: 8, marginBottom: 8 },
  activeTabButton: { backgroundColor: '#F4FAD3', borderColor: '#DCE5B6' },
  tabText: { fontSize: 14, color: '#555' },
  activeTabText: { color: '#111', fontWeight: 'bold' },
  plusButton: { width: 40, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#C4CCD8', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  plusText: { fontSize: 18, color: '#555' },
  content: { flex: 1, paddingHorizontal: 20 },
  routeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#C4CCD8' },
  iconBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  routeInfo: { flex: 1 },
  routeTitle: { fontSize: 17, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  routeDetailsRow: { flexDirection: 'row', alignItems: 'center' },
  routeDetails: { fontSize: 13, color: '#888' },
  favoriteBtn: { padding: 8, paddingRight: 0 },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#999' },
  optionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  optionBox: { width: '70%', backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  optionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  optionBtn: { paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'center' },
  optionBtnText: { fontSize: 16, color: '#333' }
});

export default RouteScreen;