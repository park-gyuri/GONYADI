import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRoutes } from '../context/RouteContext';
import { requestNewRoute } from '../api/routeApi';
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
  const [isDestinationError, setIsDestinationError] = useState(false);

  // 로딩 및 전역 Context 상태
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentRecommendation, setCurrentFormData } = useRoutes();

  React.useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
    }
  }, [initialDestination]);

  // 1. 카테고리 바텀 시트 스위치
  const [isModalVisible, setModalVisible] = useState(false);

  // 1-1. 날짜(캘린더) 상태 관리 (기간 선택)
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // 'YYYY-MM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1-2. 박/일 상태 관리
  const [nights, setNights] = useState('');
  const [days, setDays] = useState('');
  const [isDurationError, setIsDurationError] = useState(false); // 미입력 시 테두리 색상용 상태

  // 상세 요청 텍스트
  const [userMessage, setUserMessage] = useState('');

  // 제출 버튼 클릭 시 유효성 검사 로직
  const handleSubmit = async () => {
    let hasError = false;

    // 여행지 검사
    if (!destination.trim()) {
      setIsDestinationError(true);
      hasError = true;
    } else {
      setIsDestinationError(false);
    }

    // 여행 기간 검사
    if (!nights || !days) {
      setIsDurationError(true);
      hasError = true;
    } else {
      setIsDurationError(false);
    }

    // 상세 카테고리 태그 개수 검사
    if (selectedTags.length === 0) {
      setIsTagError(true);
      hasError = true;
    } else {
      setIsTagError(false);
    }

    if (hasError) return; // 에러가 하나라도 있으면 함수 종료

    setIsLoading(true);

    try {
      // 폼 데이터를 객체로 묶기
      const formData = {
        destination,
        startDate,
        endDate,
        nights,
        days,
        personCount,
        selectedBudget,
        selectedTags,
        userMessage,
      };

      // API 호출
      const result = await requestNewRoute(formData);

      // 결과를 Context에 저장
      setCurrentRecommendation(result);
      setCurrentFormData(formData);

      // 성공 시 다음 화면 이동!
      router.push('/route-result');

    } catch (error) {
      Alert.alert('경로 추천 실패', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 캘린더 날짜 클릭 시 로직
  const handleDayPress = (day) => {
    const dateStr = day.dateString;

    // 두 날짜가 모두 선택되어 있거나, 아무것도 없을 땐 시작일로 초기화 
    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate('');
      setNights('');
      setDays('');
    }
    // 시작일이 있는데 종료일이 없을 때
    else if (!endDate) {
      const sDate = new Date(startDate);
      const eDate = new Date(dateStr);

      if (eDate < sDate) {
        // 종료일이 시작일보다 빠르면 시작일로 덮어쓰기
        setStartDate(dateStr);
      } else {
        // 종료일 세팅 및 박/일 계산
        setEndDate(dateStr);
        const diffTime = Math.abs(eDate - sDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 박 수
        setNights(diffDays.toString());
        setDays((diffDays + 1).toString());

        setIsDurationError(false); // 달력으로 기간이 채워지면 에러 즉시 해제
      }
    }
  };

  // 선택 완료 버튼 클릭 로직 (한 날짜만 마킹하고 완료 누르면 당일치기 처리)
  const handleConfirmCalendar = () => {
    if (startDate && !endDate) {
      setEndDate(startDate);
      setNights('0');
      setDays('1');
      setIsDurationError(false);
    }
    setCalendarVisible(false);
  };

  // 선택된 날짜 사이에 색칠하는 객체 생성기
  const getMarkedDates = () => {
    let marked = {};

    // 날짜 포맷 헬퍼 (한국 시간대 시차 오류 방지)
    const getLocalDateString = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // 1. '현재 뷰의 달'에 해당하는 주말(토, 일) 날짜들만 회색으로 커스텀
    // (전후 달의 날짜들은 캘린더 기본 제공 '흐린 텍스트'가 적용되도록 제외)
    const baseDate = new Date(currentMonth + '-01');
    const startOfM = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const endOfM = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    let iter = new Date(startOfM);
    while (iter <= endOfM) {
      if (iter.getDay() === 0 || iter.getDay() === 6) { // 일요일=0, 토요일=6
        // UTC 변환 오류 방지를 위해 로컬 날짜 직접 반환
        const dateString = getLocalDateString(iter);
        marked[dateString] = { textColor: '#9CA3AF' };
      }
      iter.setDate(iter.getDate() + 1);
    }

    // 2. 사용자가 선택한 출발/도착일 마킹 (주말 색상 위에 덮어씌움)
    if (startDate) {
      marked[startDate] = {
        ...marked[startDate],
        startingDay: true,
        endingDay: !endDate || startDate === endDate, // 도착일이 없거나 같으면 온전한 원(동그라미)으로 그림
        color: '#43B0AB',
        textColor: 'white'
      };
    }
    if (endDate && endDate !== startDate) {
      marked[endDate] = {
        ...marked[endDate],
        endingDay: true,
        color: '#43B0AB',
        textColor: 'white'
      };
    }
    if (startDate && endDate) {
      let current = new Date(startDate);
      current.setDate(current.getDate() + 1);
      const end = new Date(endDate);
      while (current < end) {
        const dateString = getLocalDateString(current);
        marked[dateString] = { color: '#C9ECE6', textColor: 'black' };
        current.setDate(current.getDate() + 1);
      }
    }
    return marked;
  };

  // 화면에 보여질 텍스트 포맷
  const displayDateRange = startDate && endDate
    ? `${startDate} ~ ${endDate}`
    : startDate
      ? `${startDate} ~ (날짜 선택)`
      : "";

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
  const [isTagError, setIsTagError] = useState(false);

  // 태그 삭제 함수 (X 버튼)
  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  // 태그 추가 함수 (바텀 시트에서 선택 시)
  const handleAddTag = (newTag) => {
    if (!selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setIsTagError(false); // 새로운 태그가 추가되면 에러 강제 해제
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
            <View style={[styles.inputWrapper, isDestinationError && styles.errorBorder]}>
              <TextInput
                style={styles.textInput}
                placeholder="어디로 떠나시나요?"
                value={destination}
                onChangeText={(text) => {
                  setDestination(text);
                  setIsDestinationError(false); // 아무 자판이나 치면 즉시 알림 해제
                }}
              />
            </View>
            {/* 하단 경고 문구 표시 */}
            {isDestinationError && (
              <Text style={styles.errorText}>* 여행지를 입력해주세요.</Text>
            )}
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <CalenderIcon width={18} height={18} />
              <Text style={styles.labelWithIcon}>여행 일정 (선택)</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="버튼을 눌러 출발/도착 날짜를 선택하세요  →"
                value={displayDateRange}
                editable={false}
              />
              <View style={styles.verticalDivider} />
              <TouchableOpacity style={styles.iconPlaceholder} onPress={() => setCalendarVisible(true)}>
                <CalenderIcon width={20} height={20} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <HourglassIcon width={18} height={18} />
              <Text style={styles.labelWithIcon}>여행 기간</Text>
            </View>
            <View style={styles.rowWrapper}>
              <TextInput
                style={[styles.textInput, styles.shortInput, isDurationError && styles.errorBorder]}
                keyboardType="numeric"
                value={nights}
                onChangeText={(text) => {
                  setNights(text);
                  setIsDurationError(false); // 어떤 숫자든 치면 즉시 알림 해제
                }}
              />
              <Text style={styles.unitText}>박</Text>
              <TextInput
                style={[styles.textInput, styles.shortInput, isDurationError && styles.errorBorder]}
                keyboardType="numeric"
                value={days}
                onChangeText={(text) => {
                  setDays(text);
                  setIsDurationError(false); // 어떤 숫자든 치면 즉시 알림 해제
                }}
              />
              <Text style={styles.unitText}>일</Text>
            </View>

            {/* 하단 경고 문구 표시 */}
            {isDurationError && (
              <Text style={styles.errorText}>* 여행 기간을 입력해주세요.</Text>
            )}
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
                <Text style={styles.labelWithIcon}>1인 예산 (선택)</Text>
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
            <View style={[styles.textAreaWrapper, isTagError && styles.errorBorder]}>
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
              <TextInput 
                style={styles.textArea} 
                multiline 
                placeholder="예: 경기도 위주로 힐링 여행 추천해줘. 맛집 탐방을 하고 싶어." 
                value={userMessage}
                onChangeText={setUserMessage}
              />
            </View>

            {/* 하단 경고 문구 표시: 태그 개수 검증 에러 */}
            {isTagError && (
              <Text style={styles.errorText}>* 카테고리를 1개 이상 골라주세요.</Text>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <Text style={styles.submitButtonText}>경로 탐색 중... 잠시만 기다려주세요</Text>
            ) : (
              <>
                <SendIcon width={20} height={20} style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>경로 추천받기</Text>
              </>
            )}
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

      {/* ================================================== */}
      {/* 2. [달력 모달 (기간 선택용)] */}
      {/* ================================================== */}
      <Modal animationType="fade" transparent={true} visible={isCalendarVisible} onRequestClose={() => setCalendarVisible(false)}>
        <TouchableOpacity style={styles.calendarModalOverlay} activeOpacity={1} onPress={() => setCalendarVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.calendarModalContent}>
            <Calendar
              markingType={'period'}
              markedDates={getMarkedDates()}
              onDayPress={handleDayPress}
              onMonthChange={(month) => setCurrentMonth(month.dateString.substring(0, 7))}
              monthFormat={'yyyy년 MM월'}
              theme={{
                selectedDayBackgroundColor: '#43B0AB',
                todayTextColor: '#43B0AB',
                arrowColor: '#43B0AB',
              }}
            />
            <TouchableOpacity style={styles.calendarConfirmBtn} onPress={handleConfirmCalendar}>
              <Text style={styles.calendarConfirmText}>선택 완료</Text>
            </TouchableOpacity>
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
  errorBorder: {
    borderColor: '#FF5252',
    borderWidth: 1.5,
    backgroundColor: '#FFEBEE',
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 4
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginLeft: 4,
  },
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
  dropdownItemText: { fontSize: 13, color: '#333' },

  calendarModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  calendarModalContent: { backgroundColor: '#FFF', borderRadius: 16, width: '90%', padding: 20 },
  calendarConfirmBtn: { backgroundColor: '#AEE4D7', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  calendarConfirmText: { fontSize: 14, fontWeight: 'bold', color: '#111' }
});

export default RecommendInputScreen;