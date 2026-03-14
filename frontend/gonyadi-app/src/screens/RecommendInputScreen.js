import React, { useState } from 'react'; // 🌟 모달을 껐다 켰다 할 수 있게 useState 추가!
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native'; // 🌟 Modal 추가!
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const RecommendInputScreen = () => {
  const router = useRouter();
  
  // 🌟 바텀 시트(모달)가 열려있는지 닫혀있는지 기억하는 스위치 역할! (초기값: false 닫힘)
  const [isModalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. 상단 헤더 영역 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text> 
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 경로 추천받기</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* 2. 메인 입력 폼 영역 */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formBox}>
          
          {/* [여행지] */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>📍 여행지</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.textInput} placeholder="어디로 떠나시나요?" />
              <View style={styles.verticalDivider} />
              <Text style={styles.iconPlaceholder}>🔍</Text>
            </View>
          </View>

          {/* [여행 일정] */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>📅 여행 일정(선택)</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.textInput} placeholder="2026-01-12 ~ 2026-01-15" editable={false} />
              <View style={styles.verticalDivider} />
              <Text style={styles.iconPlaceholder}>📆</Text>
            </View>
          </View>

          {/* [여행 기간] */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>⏳ 여행 기간</Text>
            <View style={styles.rowWrapper}>
              <TextInput style={[styles.textInput, styles.shortInput]} keyboardType="numeric" />
              <Text style={styles.unitText}>박</Text>
              <TextInput style={[styles.textInput, styles.shortInput]} keyboardType="numeric" />
              <Text style={styles.unitText}>일</Text>
            </View>
          </View>

          {/* [인원 및 예산] */}
          <View style={styles.rowSection}>
            <View style={styles.halfSection}>
              <Text style={styles.label}>👥 인원</Text>
              <View style={styles.counterWrapper}>
                <TouchableOpacity style={styles.counterBtnArea}><Text style={styles.counterBtn}>−</Text></TouchableOpacity>
                <View style={styles.counterDivider} />
                <View style={styles.counterValueArea}><Text style={styles.counterValue}>0</Text></View>
                <View style={styles.counterDivider} />
                <TouchableOpacity style={styles.counterBtnArea}><Text style={styles.counterBtn}>+</Text></TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.halfSection}>
              <Text style={styles.label}>₩ 1인 예산(선택)</Text>
              <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.6}>
                <TextInput style={styles.textInput} editable={false} pointerEvents="none" placeholder="금액 선택" />
                <View style={styles.verticalDivider} />
                <Text style={styles.iconPlaceholder}>∨</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* [상세 요청] */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>≡ 상세 요청</Text>
            <View style={styles.textAreaWrapper}>
              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>힐링</Text>
                  <TouchableOpacity style={styles.tagDeleteBtn}><Text style={styles.tagDeleteText}>✕</Text></TouchableOpacity>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>뚜벅이</Text>
                  <TouchableOpacity style={styles.tagDeleteBtn}><Text style={styles.tagDeleteText}>✕</Text></TouchableOpacity>
                </View>
                
                {/* 🌟 핵심! + 버튼을 누르면 setModalVisible(true)가 실행되면서 모달이 열림! */}
                <TouchableOpacity 
                  style={styles.tagPlus} 
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.tagPlusText}>+</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={styles.textArea} multiline placeholder="예시) 경기도 위주로 힐링 여행 추천해줘. 맛집 탐방을 하고 싶어." />
            </View>
          </View>

          {/* [완료 버튼] */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => router.push('/route-result')}
          >
            <Text style={styles.submitButtonText}>➤ 경로 추천받기</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* ================================================== */}
      {/* 🌟 [바텀 시트 (카테고리 선택 모달)] 추가된 부분! 🌟 */}
      {/* ================================================== */}
      <Modal
        animationType="slide" // 아래에서 위로 스르륵 올라오는 애니메이션
        transparent={true}    // 배경을 투명하게 해서 뒤에 원래 화면이 비치게 함
        visible={isModalVisible} // isModalVisible이 true일 때만 화면에 보임
        onRequestClose={() => setModalVisible(false)} // 안드로이드 뒤로가기 버튼 누르면 닫힘
      >
        {/* 모달 바깥의 반투명한 까만 배경 (누르면 닫히도록 터치 버튼으로 만듦) */}
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          {/* 실제 하얀색 바텀 시트 부분 (클릭해도 안 닫히게 막아줌) */}
          <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
            
            {/* 맨 위에 있는 회색 손잡이 모양 */}
            <View style={styles.dragHandle} />
            
            <Text style={styles.sheetTitle}>원하는 여행 카테고리 선택</Text>

            {/* 카테고리 내용물이 길어질 수 있으니 스크롤뷰 적용 */}
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* 1. 이동수단 */}
              <Text style={styles.categorySectionTitle}>이동수단</Text>
              <View style={styles.categoryTagsWrapper}>
                {['도보', '자동차', '자전거', '대중교통'].map((item) => (
                  <TouchableOpacity key={item} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 2. 여행테마 */}
              <Text style={styles.categorySectionTitle}>여행테마</Text>
              <View style={styles.categoryTagsWrapper}>
                {['힐링', '맛집', '사진', '전시', '체험', '카페', '오락', '레저', '역사', '문화'].map((item) => (
                  <TouchableOpacity key={item} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. 여행조건 */}
              <Text style={styles.categorySectionTitle}>여행조건</Text>
              <View style={styles.categoryTagsWrapper}>
                {['휠체어', '반려동물 동반', '주차장'].map((item) => (
                  <TouchableOpacity key={item} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* 맨 아래 여백 */}
              <View style={{ height: 40 }} />
            </ScrollView>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

// ==================================================
// 🎨 스타일시트 (바텀 시트 스타일 추가됨)
// ==================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  formBox: { borderWidth: 1.5, borderColor: '#818389', borderRadius: 12, padding: 16, marginBottom: 100 },
  inputSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#111' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingLeft: 12, paddingRight: 8, height: 44 },
  textInput: { flex: 1, fontSize: 14, color: '#333' },
  iconPlaceholder: { fontSize: 16, color: '#555', paddingHorizontal: 4 },
  verticalDivider: { width: 1, height: 20, backgroundColor: '#E0E0E0', marginHorizontal: 6 },
  rowWrapper: { flexDirection: 'row', alignItems: 'center' },
  shortInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, width: 60, height: 44, textAlign: 'center' },
  unitText: { marginHorizontal: 8, fontSize: 14, fontWeight: 'bold' },
  rowSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  halfSection: { flex: 0.48 },
  counterWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, height: 44, overflow: 'hidden' },
  counterBtnArea: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  counterValueArea: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  counterBtn: { fontSize: 20, color: '#555' },
  counterValue: { fontSize: 16, fontWeight: 'bold' },
  counterDivider: { width: 1, height: '100%', backgroundColor: '#E0E0E0' },
  textAreaWrapper: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, backgroundColor: '#EAF5FF', minHeight: 120 },
  tagRow: { flexDirection: 'row', marginBottom: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#C4CCD8', borderRadius: 16, paddingVertical: 6, paddingLeft: 12, paddingRight: 6, marginRight: 6 },
  tagText: { fontSize: 13, color: '#333' },
  tagDeleteBtn: { paddingHorizontal: 6, marginLeft: 2 },
  tagDeleteText: { fontSize: 12, color: '#8E9EAB' },
  tagPlus: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#C4CCD8', borderRadius: 16, width: 36, height: 32 },
  tagPlusText: { fontSize: 16, color: '#555' },
  textArea: { flex: 1, fontSize: 14, color: '#333', textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#A9B6C2', borderRadius: 8, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#111' },

  // ==============================================
  // 🌟 바텀 시트 (모달) 전용 스타일 모음
  // ==============================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명한 까만 배경
    justifyContent: 'flex-end', // 내용물을 맨 아래로 밀어냄
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, // 윗부분만 둥글게
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%', // 화면 높이의 최대 80%까지만 차지하도록
  },
  dragHandle: {
    width: 50,
    height: 4,
    backgroundColor: '#6C7E95', // 피그마에 있던 짙은 회색 손잡이
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#111',
  },
  categorySectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  categoryTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap', // 공간이 부족하면 자동으로 다음 줄로 넘어가게 함! (아주 중요)
    marginBottom: 24,
  },
  categoryTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8, // 피그마처럼 살짝 둥근 네모
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryTagText: {
    fontSize: 14,
    color: '#555',
  },
});

export default RecommendInputScreen;