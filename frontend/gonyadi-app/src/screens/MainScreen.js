import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
// 이 줄을 새로 추가해 주세요!
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// 파일명 및 컴포넌트 이름은 확실하게 MainScreen으로 통일!
const MainScreen = () => {
    const router = useRouter(); // 🌟 이거 추가!
  return (
    // SafeAreaView: 노치나 상태바 영역을 침범하지 않게 해주는 최상위 컨테이너
    <SafeAreaView style={styles.container}>
      
      {/* 1. 상단 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MYROUTE</Text>
      </View>

      {/* 2. 메인 콘텐츠 영역 (스크롤 가능하게 ScrollView 사용) */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        {/* [섹션 A] 여행 경로 추천 받기 */}
        {/* 디자인을 보면 연한 파란색 배경 박스 안에 제목과 회색 박스가 들어있습니다. */}
        <View style={styles.sectionBox}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => router.push('/recommend')}>
            <Text style={styles.sectionTitle}>여행 경로 추천 받기</Text>
            <Text style={styles.arrowIcon}>→</Text> 
          </TouchableOpacity>
          
          {/* 큰 회색 아이콘 박스 (나중에 실제 아이콘 이미지로 교체할 부분) */}
          <TouchableOpacity style={styles.largeHeroBox}>
            {/* 여기에 꼬불꼬불한 경로 아이콘이 들어갑니다 */}
          </TouchableOpacity>
        </View>

        {/* [섹션 B] 추천 여행지 */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>추천 여행지</Text>
          
          {/* 가로로 스크롤되는 여행지 리스트 (horizontal 속성 추가) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            
            {/* 추천 여행지 카드 1 (경주) */}
            <View style={styles.destinationCard}>
              {/* 🌟 수정된 부분: 파란 배경 안에 들어가는 흰색 둥근 박스 */}
              <View style={styles.destinationInnerWhiteBox}>
                {/* 나중에 여기에 회색 도형(아이콘)들이 들어갈 자리 */}
              </View>
              <View style={styles.destinationTextContainer}>
                <Text style={styles.countryText}>대한민국</Text>
                <Text style={styles.cityText}>경주</Text>
              </View>
            </View>

            {/* 추천 여행지 카드 1 (경주) */}
            <View style={styles.destinationCard}>
              {/* 🌟 수정된 부분: 파란 배경 안에 들어가는 흰색 둥근 박스 */}
              <View style={styles.destinationInnerWhiteBox}>
                {/* 나중에 여기에 회색 도형(아이콘)들이 들어갈 자리 */}
              </View>
              <View style={styles.destinationTextContainer}>
                <Text style={styles.countryText}>대한민국</Text>
                <Text style={styles.cityText}>경주</Text>
              </View>
            </View>

            {/* 추천 여행지 카드 1 (경주) */}
            <View style={styles.destinationCard}>
              {/* 🌟 수정된 부분: 파란 배경 안에 들어가는 흰색 둥근 박스 */}
              <View style={styles.destinationInnerWhiteBox}>
                {/* 나중에 여기에 회색 도형(아이콘)들이 들어갈 자리 */}
              </View>
              <View style={styles.destinationTextContainer}>
                <Text style={styles.countryText}>대한민국</Text>
                <Text style={styles.cityText}>경주</Text>
              </View>
            </View>

          </ScrollView>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

// 피그마 디자인을 반영하는 스타일시트
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 전체 배경 흰색
  },
  // --- 헤더 스타일 ---
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // 헤더 아래 얇은 회색 선
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2, // 자간 넓히기
  },
  // --- 메인 콘텐츠 스타일 ---
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16, // 양옆 여백
    paddingTop: 20,
  },
  sectionBox: {
    backgroundColor: '#EAF5FF', // 연한 파란색 배경 (피그마 코드 확인 필요)
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  arrowIcon: {
    fontSize: 20,
    color: '#333',
  },
  largeHeroBox: {
    backgroundColor: '#BDCDDB', // 진한 회색-파랑 박스 (피그마 코드 확인 필요)
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- 가로 스크롤 카드 스타일 ---
  horizontalScroll: {
    marginTop: 12,
  },
  destinationCard: {
    width: 132,                 // 🌟 안에 흰 박스가 여유롭게 들어가도록 너비를 살짝 키움
    backgroundColor: '#BDCDDB', // 진한 파랑-회색 바탕 (피그마 색상으로 변경 가능)
    borderRadius: 16,
    marginRight: 12,
    padding: 10,                // 🌟 핵심 1: 카드 전체에 10px 안쪽 여백을 줘서 파란 테두리가 생기게 함
  },
  destinationInnerWhiteBox: {
    height: 120,
    backgroundColor: '#FFFFFF', // 🌟 핵심 2: 안쪽에 들어가는 진짜 흰색 박스
    borderRadius: 12,           // 흰 박스 자체에도 둥근 모서리 적용
  },
  destinationTextContainer: {
    paddingTop: 10,             // 흰 박스와 글씨 사이의 간격
    paddingHorizontal: 4,       // 글씨 좌우 여백
  },
  countryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
  },
  cityText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
});

export default MainScreen;