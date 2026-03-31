import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PinIcon from '../components/icons/pinIcon';
import CalenderIcon from '../components/icons/calenderIcon';
import HourglassIcon from '../components/icons/hourglassIcon';
import PeopleIcon from '../components/icons/peopleIcon';
import MoneyIcon from '../components/icons/moneyIcon';
import ListIcon from '../components/icons/listIcon';
import SendIcon from '../components/icons/sendIcon';

const RecommendInputScreen = () => {
  const router = useRouter();
  const { destination: initialDestination } = useLocalSearchParams();

  // 0. 여행지 상태 관리
  const [destination, setDestination] = useState(initialDestination || '');

  React.useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
    }
  }, [initialDestination]);

  // 1. 카테고리 바텀 시트 스위치
  const [isModalVisible, setModalVisible] = useState(false);

  // 2. 인원수 상태 관리
  const [personCount, setPersonCount] = useState(1);
  const handleDecrease = () => {
    if (personCount > 1) setPersonCount(personCount - 1);
  };
  const handleIncrease = () => {
    setPersonCount(personCount + 1);
  };

  // 3. 예산 드롭다운 상태 관리
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState('');

  const budgetOptions = [
    '0 ~ 100,000',
    '100,000 ~ 300,000',
    '300,000 ~ 500,000',
    '500,000 ~ 1,000,000',
    '1,000,000 이상'
  ];

  const handleSelectBudget = (budget) => {
    setSelectedBudget(budget);
    setDropdownOpen(false);
  };

  // 4. 상세 요청 태그 상태 관리
  const [selectedTags, setSelectedTags] = useState(['힐링', '도보']);

  // 태그 삭제 함수 (X 버튼)
  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  // 태그 추가 함수 (바텀 시트에서 선택 시)
  const handleAddTag = (newTag) => {
    if (!selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
    }
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 경로 추천받기</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <View style={styles.formBox}>

          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <PinIcon width={16} height={16} />
              <Text style={styles.labelWithIcon}>여행지</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="어디로 떠나시나요?"
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <CalenderIcon width={18} height={18} />
              <Text style={styles.labelWithIcon}>여행 일정(선택)</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.textInput} placeholder="2026-01-12 ~ 2026-01-15" editable={false} />
              <View style={styles.verticalDivider} />
              <View style={styles.iconPlaceholder}>
                <CalenderIcon width={20} height={20} />
              </View>
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <HourglassIcon width={18} height={18} />
              <Text style={styles.labelWithIcon}>여행 기간</Text>
            </View>
            <View style={styles.rowWrapper}>
              <TextInput style={[styles.textInput, styles.shortInput]} keyboardType="numeric" />
              <Text style={styles.unitText}>박</Text>
              <TextInput style={[styles.textInput, styles.shortInput]} keyboardType="numeric" />
              <Text style={styles.unitText}>일</Text>
            </View>
          </View>

          <View style={[styles.rowSection, { zIndex: 1000 }]}>
            <View style={styles.halfSection}>
              <View style={styles.labelRow}>
                <PeopleIcon width={18} height={18} />
                <Text style={styles.labelWithIcon}>인원</Text>
              </View>
              <View style={styles.counterWrapper}>
                <TouchableOpacity style={styles.counterBtnArea} onPress={handleDecrease}>
                  <Text style={styles.counterBtn}>−</Text>
                </TouchableOpacity>
                <View style={styles.counterDivider} />
                <View style={styles.counterValueArea}>
                  <Text style={styles.counterValue}>{personCount}</Text>
                </View>
                <View style={styles.counterDivider} />
                <TouchableOpacity style={styles.counterBtnArea} onPress={handleIncrease}>
                  <Text style={styles.counterBtn}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.halfSection, { zIndex: 1000 }]}>
              <View style={styles.labelRow}>
                <MoneyIcon width={18} height={18} />
                <Text style={styles.labelWithIcon}>1인 예산(선택)</Text>
              </View>
              <TouchableOpacity style={styles.inputWrapper} activeOpacity={0.8} onPress={() => setDropdownOpen(!isDropdownOpen)}>
                <Text style={[styles.textInput, { color: selectedBudget ? '#333' : '#999' }]} numberOfLines={1} adjustsFontSizeToFit={true}>
                  {selectedBudget || "금액 선택"}
                </Text>
                <View style={styles.verticalDivider} />
                <Text style={styles.iconPlaceholder}>{isDropdownOpen ? '∧' : '∨'}</Text>
              </TouchableOpacity>

              {isDropdownOpen && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 250 }} keyboardShouldPersistTaps="handled">
                    {budgetOptions.map((budget, index) => (
                      <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => handleSelectBudget(budget)}>
                        <Text style={styles.dropdownItemText}>{budget}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.inputSection, { zIndex: 1 }]}>
            <View style={styles.labelRow}>
              <ListIcon width={18} height={18} />
              <Text style={styles.labelWithIcon}>상세 요청</Text>
            </View>
            <View style={styles.textAreaWrapper}>
              <View style={styles.tagRow}>

                {selectedTags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity style={styles.tagDeleteBtn} onPress={() => handleRemoveTag(tag)}>
                      <Text style={styles.tagDeleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.tagPlus} onPress={() => setModalVisible(true)}>
                  <Text style={styles.tagPlusText}>+</Text>
                </TouchableOpacity>
              </View>
              <TextInput style={styles.textArea} multiline placeholder="예시) 경기도 위주로 힐링 여행 추천해줘. 맛집 탐방을 하고 싶어." />
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={() => router.push('/route-result')}>
            <SendIcon width={20} height={20} style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>경로 추천받기</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* ================================================== */}
      {/* 1. [바텀 시트 (카테고리 선택 모달)] */}
      {/* ================================================== */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} statusBarTranslucent={true} onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>원하는 여행 카테고리 선택</Text>
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.categorySectionTitle}>이동수단</Text>
              <View style={styles.categoryTagsWrapper}>
                {['도보', '자동차', '자전거', '대중교통'].map((item) => (
                  <TouchableOpacity key={item} style={styles.categoryTag} onPress={() => handleAddTag(item)}>
                    <Text style={styles.categoryTagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.categorySectionTitle}>여행테마</Text>
              <View style={styles.categoryTagsWrapper}>
                {['힐링', '음식', '카페', '사진', '전시', '체험', '쇼핑', '역사', '축제', '자연', '액티비티'].map((item) => (
                  <TouchableOpacity key={item} style={styles.categoryTag} onPress={() => handleAddTag(item)}>
                    <Text style={styles.categoryTagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.categorySectionTitle}>여행조건</Text>
              <View style={styles.categoryTagsWrapper}>
                {['휠체어', '반려동물 동반', '어린이 동반'].map((item) => (
                  <TouchableOpacity key={item} style={styles.categoryTag} onPress={() => handleAddTag(item)}>
                    <Text style={styles.categoryTagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  formBox: { borderWidth: 1.5, borderColor: '#818389', borderRadius: 12, padding: 16, marginBottom: 100 },
  inputSection: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#111' },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  labelWithIcon: { fontSize: 14, fontWeight: 'bold', color: '#111', marginLeft: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingLeft: 12, paddingRight: 8, height: 44, backgroundColor: '#FFF' },
  textInput: { flex: 1, fontSize: 14, color: '#333' },
  iconPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
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
  textAreaWrapper: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, backgroundColor: '#FFFFFF', minHeight: 120 },
  tagRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C4CCD8', borderRadius: 16, paddingVertical: 6, paddingLeft: 12, paddingRight: 6, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: 13, color: '#333' },
  tagDeleteBtn: { paddingHorizontal: 6, marginLeft: 2 },
  tagDeleteText: { fontSize: 12, color: '#8E9EAB' },
  tagPlus: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C4CCD8', borderRadius: 16, width: 36, height: 32, marginBottom: 6 },
  tagPlusText: { fontSize: 14, color: '#555' },
  textArea: { flex: 1, fontSize: 14, color: '#333', textAlignVertical: 'top' },
  submitButton: { flexDirection: 'row', backgroundColor: '#AEE4D7', borderRadius: 8, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#111' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '80%' },
  dragHandle: { width: 50, height: 4, backgroundColor: '#6C7E95', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#111' },
  categorySectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  categoryTagsWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  categoryTag: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', marginRight: 8, marginBottom: 8 },
  categoryTagText: { fontSize: 14, color: '#555' },

  dropdownList: { position: 'absolute', top: 75, left: 0, right: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 10, zIndex: 1000 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 13, color: '#333' }
});

export default RecommendInputScreen;