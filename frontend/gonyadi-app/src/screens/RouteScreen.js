import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FolderCreateModal from '../components/FolderCreateModal';
import FileIcon from '../components/icons/fileIcon';
import GrayMarkerIcon from '../components/icons/graymarkerIcon';
import StarIcon from '../components/icons/starIcon';
import { useRoutes } from '../context/RouteContext';

const RouteScreen = () => {
  const router = useRouter();
  const { folders, allRoutes, toggleFavorite, addFolder, updateFolder, deleteFolder } = useRoutes();
  const [activeTabName, setActiveTabName] = useState('국내');

  // 모달 제어 상태
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [isOptionVisible, setOptionVisible] = useState(false);

  // 선택된 폴더(카테고리)에 해당하는 경로 필터링
  const filteredRoutes = allRoutes
    .filter(route => route.category === activeTabName)
    .sort((a, b) => {
      if (a.isFavorite === b.isFavorite) return 0;
      return a.isFavorite ? -1 : 1;
    });

  // 폴더 제출 처리
  const handleSubmitFolder = async (name) => {
    if (modalMode === 'create') {
      addFolder(name);
    } else if (modalMode === 'edit' && selectedFolderId) {
      try {
        await updateFolder(selectedFolderId, name);
        if (activeTabName === selectedFolderName) setActiveTabName(name); // 현재 보고 있는 탭이면 이름 변경
      } catch (e) {
        Alert.alert("수정 실패", "폴더 이름을 수정할 수 없습니다.");
      }
    }
    setModalVisible(false);
  };

  // 폴더 삭제 처리
  const handleDeleteFolder = () => {
    Alert.alert(
      "폴더 삭제", 
      `'${selectedFolderName}' 폴더를 정말 삭제하시겠습니까?\n내부에 저장된 경로가 삭제될 수 있습니다.`,
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteFolder(selectedFolderId);
              if (activeTabName === selectedFolderName) {
                setActiveTabName('국내'); // 삭제된 경우 기본 폴더로 이동
              }
              setOptionVisible(false);
            } catch (e) {
              Alert.alert("삭제 실패", "폴더를 삭제할 수 없습니다.");
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>여행 경로</Text></View>

      {/* 📂 상단 폴더 탭 영역 */}
      <View style={styles.tabContainer}>
        {folders.map((folder) => (
          <TouchableOpacity
            key={folder.folder_pk}
            style={[styles.tabButton, activeTabName === folder.name && styles.activeTabButton]}
            onPress={() => setActiveTabName(folder.name)}
            onLongPress={() => { 
              setSelectedFolderId(folder.folder_pk); 
              setSelectedFolderName(folder.name); 
              setOptionVisible(true); 
            }}
          >
            <Text style={[styles.tabText, activeTabName === folder.name && styles.activeTabText]}>{folder.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.plusButton} onPress={() => { setModalMode('create'); setModalVisible(true); }}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 📍 저장된 경로 리스트 영역 */}
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {filteredRoutes.length > 0 ? (
          filteredRoutes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.routeCard}
              onPress={() => router.push({ pathname: '/saved-route-detail', params: { id: route.id, title: route.title } })}
            >
              <View style={styles.iconBox}>
                <FileIcon width={21} height={26} style={{ marginTop: -4 }} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeTitle}>{route.title}</Text>
                <View style={styles.routeDetailsRow}>
                  <GrayMarkerIcon width={14} height={14} style={{ marginRight: 4 }} />
                  <Text style={styles.routeDetails}>{route.location} | {route.days}일 코스</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(route.id)}>
                <StarIcon isFilled={route.isFavorite} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>저장된 경로가 없습니다.</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 팝업 모달들 */}
        <FolderCreateModal
        visible={isModalVisible}
        mode={modalMode}
        initialValue={modalMode === 'edit' ? selectedFolderName : ''}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitFolder}
      />

      <Modal visible={isOptionVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.optionOverlay} onPress={() => setOptionVisible(false)}>
          <View style={styles.optionBox}>
            <Text style={styles.optionTitle}>폴더 관리: {selectedFolderName}</Text>
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  emptyText: { color: '#999', fontSize: 15 },
  optionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  optionBox: { width: '70%', backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  optionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  optionBtn: { paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'center' },
  optionBtnText: { fontSize: 16, color: '#333' }
});

export default RouteScreen;