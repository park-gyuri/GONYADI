// src/data/dummyData.js

export const mockRouteResultBusan = {
  userInput: {
    destination: "부산광역시",
    startDate: "2024-07-02",
    endDate: "2024-07-04",
    duration: "2박 3일",
    travelers: 2,
    budgetPerPerson: null,
    tags: ["도보", "대중교통", "쇼핑", "사진", "역사"]
  },
  id: 105,
  schedule: [
    {
      day: 1,
      places: [
        { id: "p1", name: "부산역", time: "12:00 PM", address: "부산 동구 중앙대로 206", description: "교통", transport: null },
        { id: "p2", name: "삼진어묵 부산역광장점", time: "12:30 PM", address: "부산 동구 중앙대로214번길 7", description: "식당", transport: { type: "도보", duration: "5분" } },
        { id: "p3", name: "이재모피자 서면점", time: "02:00 PM", address: "부산 부산진구 전포대로209번길 21", description: "식당", transport: { type: "지하철", duration: "30분" } },
        { id: "p4", name: "넘버25호텔 서면1번가점", time: "04:00 PM", address: "부산 부산진구 부전로20번길 14", description: "숙소", transport: { type: "도보", duration: "15분" } },
        { id: "p5", name: "러브액츄얼리", time: "04:40 PM", address: "부산 수영구 광안로41번길 7", description: "소품샵", transport: { type: "지하철", duration: "30분" } },
        { id: "p6", name: "프레젠띵 바이 어도르", time: "05:00 PM", address: "부산 수영구 광안로45번길 5", description: "소품샵", transport: { type: "도보", duration: "5분" } },
        { id: "p7", name: "분홍이네", time: "05:20 PM", address: "부산 수영구 광안로45번길 2", description: "소품샵", transport: { type: "도보", duration: "5분" } },
        { id: "p8", name: "러브이즈기빙 1호점", time: "05:45 PM", address: "부산 수영구 광안로49번길 24", description: "소품샵", transport: { type: "도보", duration: "5분" } },
        { id: "p9", name: "광안리 해수욕장", time: "06:00 PM", address: "부산 수영구 광안해변로 219", description: "관광지", transport: { type: "도보", duration: "10분" } },
        { id: "p10", name: "온밥", time: "06:30 PM", address: "부산 수영구 수영로540번길 49", description: "식당", transport: { type: "도보", duration: "15분" } },
        { id: "p11", name: "젤라또조이 광안리점", time: "07:20 PM", address: "부산 수영구 광안로 41", description: "카페", transport: { type: "도보", duration: "10분" } }
      ]
    },
    {
      day: 2,
      places: [
        { id: "p12", name: "숙소 (출발)", time: null, address: "부산 수영구 광안해변로 인근", description: "숙소", transport: null },
        { id: "p13", name: "추억보물섬", time: "11:00 AM", address: "부산 중구 중구로 36", description: "박물관", transport: { type: "지하철", duration: "40분" } },
        { id: "p14", name: "국제시장", time: "11:40 AM", address: "부산 중구 중구로 36", description: "관광지", transport: { type: "도보", duration: "5분" } },
        { id: "p15", name: "양산집", time: "12:00 PM", address: "부산 중구 중구로47번길 30", description: "식당", transport: { type: "도보", duration: "5분" } },
        { id: "p16", name: "우리글방", time: "12:40 PM", address: "부산 중구 대청로 63", description: "카페", transport: { type: "도보", duration: "10분" } },
        { id: "p17", name: "부산근현대역사관", time: "03:00 PM", address: "부산 중구 대청로 112", description: "박물관", transport: { type: "도보", duration: "15분" } },
        { id: "p18", name: "그리다부부", time: "05:50 PM", address: "부산 중구 광복중앙로 35-1", description: "카페", transport: { type: "도보", duration: "15분" } },
        { id: "p19", name: "부평깡통시장", time: "07:30 PM", address: "부산 중구 부평동2가 82", description: "관광지", transport: { type: "도보", duration: "10분" } },
        { id: "p20", name: "자갈치시장", time: "08:00 PM", address: "부산 중구 자갈치해안로 52", description: "관광지", transport: { type: "도보", duration: "10분" } }
      ]
    },
    {
      day: 3,
      places: [
        { id: "p21", name: "숙소 (체크아웃)", time: null, address: "부산 수영구 광안해변로 인근", description: "숙소", transport: null },
        { id: "p22", name: "부산역", time: "11:00 AM", address: "부산 동구 중앙대로 206", description: "교통", transport: { type: "지하철", duration: "45분" } }
      ]
    }
  ],
  reviewSection: {
    mainTitle: "[2박 3일 부산 여행] 서면부터 광안리까지, 제대로 즐긴 로컬 감성 투어",
    allReviews: [
      { placeId: "p1", placeName: "부산역", rating: 5, comment: "언제 와도 설레는 부산의 관문!", photos: [] },
      { placeId: "p2", placeName: "삼진어묵", rating: 4, comment: "기차 타기 전 가볍게 먹기 딱 좋아요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-05 002.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-05 001.jpeg')] },
      { placeId: "p3", placeName: "이재모피자", rating: 5, comment: "인생 피자 등극! 치즈가 정말 다르네요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-06 003.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-06 004.jpeg')] },
      { placeId: "p4", placeName: "넘버25호텔", rating: 4, comment: "서면역이랑 가까워서 이동하기 편했습니다.", photos: [] },
      { placeId: "p5", placeName: "러브액츄얼리", rating: 5, comment: "귀여운 소품이 너무 많아서 지갑 지키느라 힘들었어요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-07 006.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-07 005.jpeg')] },
      { placeId: "p6", placeName: "프레젠띵 바이 어도르", rating: 4, comment: "감각적인 소품이 많아 선물 사기 좋아요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-07 007.jpeg')] },
      { placeId: "p7", placeName: "분홍이네", rating: 5, comment: "규모가 커서 구경하는 재미가 쏠쏠합니다.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-08 008.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-08 009.jpeg')] },
      { placeId: "p8", placeName: "러브이즈기빙", rating: 4, comment: "하트 감성 뿜뿜! 인테리어가 예뻐요.", photos: [] },
      { placeId: "p9", placeName: "광안리 해수욕장", rating: 5, comment: "광안대교 야경은 역시 최고입니다.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-08 010.jpeg')] },
      { placeId: "p10", placeName: "온밥", rating: 5, comment: "정갈한 생선구이 정식, 혼밥하기에도 최고예요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-08 011.jpeg')] },
      { placeId: "p11", placeName: "젤라또조이", rating: 4, comment: "후식으로 딱 좋은 달콤한 맛!", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-09 012.jpeg')] },
      { placeId: "p12", placeName: "숙소", rating: 5, comment: "상쾌한 아침 출발!", photos: [] },
      { placeId: "p13", placeName: "추억보물섬", rating: 5, comment: "부모님이랑 오면 정말 좋아하실 것 같은 레트로 박물관!", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-09 013.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-10 014.jpeg')] },
      { placeId: "p14", placeName: "국제시장", rating: 4, comment: "활기찬 시장 분위기가 너무 좋았어요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-10 015.jpeg')] },
      { placeId: "p15", placeName: "양산집", rating: 5, comment: "부산 돼지국밥의 정석, 국물이 끝내줍니다.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-10 016.jpeg')] },
      { placeId: "p16", placeName: "우리글방", rating: 4, comment: "책장 너머 들리는 클래식 음악이 힐링되네요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-13 020.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-14 021.jpeg')] },
      { placeId: "p17", placeName: "부산근현대역사관", rating: 5, comment: "무료 전시인데 퀄리티가 정말 높습니다.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-14 022.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-14 023.jpeg')] },
      { placeId: "p18", placeName: "그리다부부", rating: 5, comment: "공간 설계가 정말 독특하고 커피 맛도 훌륭해요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-15 024.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-15 025.jpeg')] },
      { placeId: "p19", placeName: "부평깡통시장", rating: 4, comment: "야시장 먹거리 종류가 정말 많아요.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-16 026.jpeg'), require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-16 027.jpeg')] },
      { placeId: "p20", placeName: "자갈치시장", rating: 4, comment: "부산의 에너지를 느낄 수 있는 곳.", photos: [require('../../assets/images/reviews/busan/KakaoTalk_Photo_2026-04-28-19-30-16 028.jpeg')] },
      { placeId: "p21", placeName: "숙소", rating: 5, comment: "체크아웃 하기 아쉬울 정도였어요.", photos: [] },
      { placeId: "p22", placeName: "부산역", rating: 5, comment: "즐거운 여행 마치고 돌아갑니다. 부산 안녕!", photos: [] }
    ]
  }
};

export const mockRouteResultDaegu = {
  // 1. [입력 화면용] 검색 조건
  userInput: {
    destination: "대구광역시",
    startDate: "2026-03-27",
    endDate: "2026-03-27",
    duration: "1일",
    travelers: 3,
    budgetPerPerson: null,
    tags: ["도보", "사진", "음식", "쇼핑"]
  },

  // 2. [경로 결과 화면용] 상세 일정 및 이동 정보
  id: 107,
  schedule: [
    {
      day: 1,
      places: [
        { id: "da1", name: "신기루 잡화점", time: "11:00 AM", address: "대구 중구 서성로14길 92", description: "소품샵", transport: null },
        { id: "da2", name: "오오오에이", time: "11:30 AM", address: "대구 중구 중앙대로 376-20", description: "식당", transport: { type: "도보", duration: "15분" } },
        { id: "da3", name: "나이스키친", time: "12:30 PM", address: "대구 중구 동성로2길 50-14", description: "소품샵", transport: { type: "도보", duration: "10분" } },
        { id: "da4", name: "스파오 동성로중앙점", time: "01:00 PM", address: "대구 중구 동성로 36 1층", description: "옷가게", transport: { type: "도보", duration: "5분" } },
        { id: "da5", name: "에잇세컨즈 대구동성로본점", time: "01:30 PM", address: "대구 중구 동성로 34 1층", description: "옷가게", transport: { type: "도보", duration: "15분" } },
        { id: "da6", name: "센터피스 동성로", time: "02:10 PM", address: "대구 중구 동성로2길 53", description: "옷가게", transport: { type: "도보", duration: "10분" } },
        { id: "da7", name: "파샵", time: "02:40 PM", address: "대구 중구 공평로 55 1동 3층", description: "소품샵", transport: { type: "도보", duration: "10분" } },
        { id: "da8", name: "해브아워", time: "03:00 PM", address: "대구 중구 동성로2길 50-11", description: "카페", transport: { type: "도보", duration: "15분" } },
        { id: "da9", name: "대키하바라", time: "04:00 PM", address: "대구 중구 동성로6길 61", description: "소품샵", transport: { type: "도보", duration: "20분" } },
        { id: "da10", name: "따끈따끈 베이커리", time: "05:30 PM", address: "대구 중구 중앙대로 395 1층", description: "베이커리", transport: { type: "도보", duration: "10분" } },
        { id: "da11", name: "도마29", time: "06:00 PM", address: "대구 중구 동성로1길 46-2", description: "식당", transport: { type: "도보", duration: "10분" } },
        { id: "da12", name: "홀리데이 비지터샵", time: "06:30 PM", address: "대구 중구 경상감영길 184 1층", description: "소품샵", transport: { type: "도보", duration: "20분" } }
      ]
    }
  ],

  // 3. [리뷰 화면용] 전체 후기 제목 및 모든 장소별 데이터
  reviewSection: {
    mainTitle: "[당일치기 대구 여행] 동성로 힙한 곳만 골라 담은 뚜벅이 코스",
    allReviews: [
      { placeId: "da1", placeName: "신기루 잡화점", rating: 5, comment: "입구부터 감성 터져요. 빈티지한 소품 좋아하면 추천!", photos: [require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-45 001.jpeg'), require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-46 002.jpeg')] },
      { placeId: "da2", placeName: "오오오에이", rating: 4, comment: "피자가 진짜 맛있습니다!!", photos: [require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-46 003.jpeg'), require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-46 004.jpeg')] },
      { placeId: "da3", placeName: "나이스키친", rating: 5, comment: "식기류 덕후라면 필수 코스! 예쁜 게 너무 많아요.", photos: [] },
      { placeId: "da4", placeName: "스파오", rating: 4, comment: "매장이 넓어서 쇼핑하기 쾌적합니다.", photos: [] },
      { placeId: "da5", placeName: "에잇세컨즈", rating: 4, comment: "신상 옷들 많아서 입어보는 재미가 쏠쏠!", photos: [] },
      { placeId: "da6", placeName: "센터피스", rating: 5, comment: "힙하고 세련된 옷들이 많고 가격대도 괜찮아요!!", photos: [] },
      { placeId: "da7", placeName: "파샵", rating: 4, comment: "예쁜 스티커나 애니 캐릭터 상품이 많아서 구경하는 재미가 있어요.", photos: [] },
      { placeId: "da8", placeName: "해브아워", rating: 5, comment: "딸기 케이크 비주얼 무엇... 인생샷 건졌습니다.", photos: [require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-47 005.jpeg'), require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-47 006.jpeg')] },
      { placeId: "da9", placeName: "대키하바라", rating: 5, comment: "피규어랑 굿즈 구경하다 보니 시간 순삭이에요.", photos: [] },
      { placeId: "da10", placeName: "따끈따끈 베이커리", rating: 4, comment: "아기자기하고 귀여운 빵들인데 빵 냄새가 너무 좋아서 그냥 지나칠 수 없었어요.", photos: [] },
      { placeId: "da11", placeName: "도마29", rating: 5, comment: "연어초밥 입에서 살살 녹아요. 웨이팅 값 합니다.", photos: [require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-48 007.jpeg'), require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-48 009.jpeg')] },
      { placeId: "da12", placeName: "홀리데이 비지터샵", rating: 5, comment: "마지막 코스로 완벽! 감성적인 LP와 포스터가 가득해요.", photos: [require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-48 010.jpeg'), require('../../assets/images/reviews/daegu/KakaoTalk_Photo_2026-04-28-19-31-49 011.jpeg')] }
    ]
  }
};

export const mockRouteResultDaejeon = {
  id: 106,
  title: "대전 빵지순례와 소품샵 나들이",
  location: "대전광역시 (동구, 서구, 중구)",
  date: "2024-06-18 ~ 2024-06-19",
  budget: null,
  schedule: [
    {
      day: 1,
      places: [
        {
          name: "대전역",
          time: "09:30 AM",
          address: "대전 동구 중앙로 215",
          description: "교통"
        },
        {
          name: "김화칼국수",
          time: "09:50 AM",
          address: "대전 동구 중앙로203번길 28 1층 (중동)",
          description: "식당"
        },
        {
          name: "한밭수목원",
          time: "11:00 AM",
          address: "대전 서구 둔산대로 169 (만년동)",
          description: "수목원, 식물원"
        },
        {
          name: "정동문화사",
          time: "12:30 PM",
          address: "대전 동구 태전로 22 1층 (중동)",
          description: "과자점"
        },
        {
          name: "땡큐베리머치",
          time: "01:00 PM",
          address: "대전 중구 중교로 49 지하1층, 1층",
          description: "카페"
        },
        {
          name: "성심당 본점",
          time: "02:30 PM",
          address: "대전 중구 대종로480번길 15",
          description: "베이커리"
        },
        {
          name: "소소로와",
          time: "03:30 PM",
          address: "대전 중구 대종로 451 2층",
          description: "소품샵"
        },
        {
          name: "프렐류드",
          time: "04:00 PM",
          address: "대전 중구 중앙로129번길 30 1층",
          description: "소품샵"
        },
        {
          name: "숙소",
          time: "05:00 PM",
          address: "대전광역시 중구 (상세 주소 미정)",
          description: "숙소"
        },
        {
          name: "중앙종합시장",
          time: "06:30 PM",
          address: "대전 동구 중교로 119",
          description: "시장"
        }
      ]
    },
    {
      day: 2,
      places: [
        {
          name: "성심당 본점",
          time: "08:00 AM",
          address: "대전 중구 대종로480번길 15",
          description: "베이커리"
        },
        {
          name: "숙소",
          time: "08:50 AM",
          address: "대전광역시 중구 (상세 주소 미정)",
          description: "숙소"
        },
        {
          name: "대전역",
          time: "11:00 AM",
          address: "대전 동구 중앙로 215",
          description: "교통"
        }
      ]
    }
  ],
  reviewSection: {
    mainTitle: "대전 빵지순례와 소품샵 나들이 후기",
    allReviews: [
      { placeId: "dj1", placeName: "김화칼국수", rating: 5, comment: "가성비 대박이고 국물이 정말 진해요!", photos: [require('../../assets/images/reviews/daejun/KakaoTalk_Photo_2026-04-28-19-31-18 002.jpeg')] },
      { placeId: "dj2", placeName: "정동문화사", rating: 5, comment: "휘낭시에랑 까눌레가 정말 환상적입니다.", photos: [require('../../assets/images/reviews/daejun/KakaoTalk_Photo_2026-04-28-19-31-18 003.jpeg')] },
      { placeId: "dj3", placeName: "성심당 본점", rating: 5, comment: "대전의 자존심! 튀김소보로는 역시 본점이 최고네요.", photos: [require('../../assets/images/reviews/daejun/KakaoTalk_Photo_2026-04-28-19-31-17 001.jpeg'), require('../../assets/images/reviews/daejun/KakaoTalk_Photo_2026-04-28-19-31-19 004.jpeg')] },
      { placeId: "dj4", placeName: "프렐류드", rating: 5, comment: "문구류 좋아하시는 분들은 꼭 가보세요. 아기자기하고 예뻐요.", photos: [require('../../assets/images/reviews/daejun/KakaoTalk_Photo_2026-04-28-19-31-19 005.jpeg')] }
    ]
  }
};

export const mockRouteResultMungyeong = {
  id: 104,
  title: "2023-7 문경 가족 여행",
  location: "경상북도 문경시 & 충청북도 충주시",
  date: "2023-07-28 ~ 2023-07-30",
  budget: null,
  schedule: [
    {
      day: 1,
      places: [
        {
          name: "용궁단골식당 신관",
          time: "12:00 PM",
          address: "경북 예천군 용궁면 용궁로 173",
          description: "식당"
        },
        {
          name: "문경오미자테마터널",
          time: "01:00 PM",
          address: "경북 문경시 마성면 문경대로 1356-1",
          description: "관광, 명소"
        },
        {
          name: "카페 가은역",
          time: "02:00 PM",
          address: "경북 문경시 가은읍 왕능리 536",
          description: "카페"
        },
        {
          name: "뉴욕제과",
          time: "04:30 PM",
          address: "경북 문경시 산북면 금천로 557",
          description: "제과, 베이커리"
        }
      ]
    },
    {
      day: 2,
      places: [
        {
          name: "문경축산농협 약돌한우프라자",
          time: "11:30 AM",
          address: "경북 문경시 호계면 문경대로 1024",
          description: "식당"
        },
        {
          name: "문경에코월드",
          time: "01:00 PM",
          address: "경북 문경시 가은읍 왕능길 114 (가은읍 왕능리)",
          description: "테마파크"
        },
        {
          name: "스타벅스 문경새재점",
          time: "04:00 PM",
          address: "경북 문경시 문경읍 새재로 906 1,2층 (문경읍 상초리)",
          description: "카페"
        },
        {
          name: "하초동",
          time: "05:30 PM",
          address: "경북 문경시 문경읍 새재로 861 (문경읍 하초리)",
          description: "식당"
        }
      ]
    },
    {
      day: 3,
      places: [
        {
          name: "중앙탑공원",
          time: "10:00 AM",
          address: "충북 충주시 중앙탑면 탑정안길 6 (중앙탑면)",
          description: "공원"
        },
        {
          name: "카페메모리아",
          time: "11:30 AM",
          address: "충북 충주시 중앙탑면 중앙탑길 120 1층",
          description: "카페"
        },
        {
          name: "남한강막국수 중앙탑본점",
          time: "12:30 PM",
          address: "충북 충주시 중앙탑면 중앙탑길 113",
          description: "식당"
        }
      ]
    }
  ],
  reviewSection: {
    mainTitle: "2023-7 문경 가족 여행 후기",
    allReviews: [
      { placeId: "m1", placeName: "용궁단골식당", rating: 5, comment: "불맛 나는 오징어 불고기가 정말 맛있어요!", photos: [] },
      { placeId: "m2", placeName: "문경오미자테마터널", rating: 4, comment: "시원하고 볼거리가 많아서 여름 여행지로 최고입니다.", photos: [require('../../assets/images/reviews/munkyeng/1.omija_tama_tunul1.jpeg'), require('../../assets/images/reviews/munkyeng/2.omija_tama_tunul2.jpeg')] },
      { placeId: "m3", placeName: "카페 가은역", rating: 5, comment: "폐역을 개조한 카페 분위기가 너무 좋고 사과 밀크티가 맛있어요.", photos: [require('../../assets/images/reviews/munkyeng/3.caffe_gaon1.jpeg'), require('../../assets/images/reviews/munkyeng/4.caffe_gaon2.jpeg')] },
      { placeId: "m4", placeName: "뉴욕제과", rating: 5, comment: "찹쌀떡이 정말 쫀득하고 달지 않아 좋았습니다. 예약 필수!", photos: [] },
      { placeId: "m5", placeName: "문경 약돌한우프라자", rating: 5, comment: "고기가 정말 신선하고 입에서 녹네요.", photos: [] },
      { placeId: "m6", placeName: "문경에코월드", rating: 5, comment: "아이들과 함께 오기 정말 좋은 곳이에요. 모노레일도 재밌습니다.", photos: [require('../../assets/images/reviews/munkyeng/6.monkyeng_ehcoWorld.jpeg')] },
      { placeId: "m7", placeName: "스타벅스 문경새재점", rating: 4, comment: "한옥 외관이 정말 멋지고 내부도 넓어서 쉬기 좋았습니다.", photos: [] },
      { placeId: "m8", placeName: "중앙탑공원", rating: 5, comment: "탁 트인 풍경과 함께 산책하기 너무 좋은 곳입니다.", photos: [require('../../assets/images/reviews/munkyeng/7.jungang_tap_park1.jpeg'), require('../../assets/images/reviews/munkyeng/8.jungang_tap_park2.jpeg')] },
      { placeId: "m9", placeName: "카페메모리아", rating: 5, comment: "중앙탑공원 근처 예쁜 카페, 인테리어가 정말 아기자기해요.", photos: [require('../../assets/images/reviews/munkyeng/9.caffe_memoria1.jpeg'), require('../../assets/images/reviews/munkyeng/10.caffe_memoria2.jpeg')] },
      { placeId: "m10", placeName: "남한강막국수", rating: 5, comment: "수육과 막국수의 조합이 완벽했습니다. 충주 맛집 인정!", photos: [require('../../assets/images/reviews/munkyeng/11.nahangang_maknudle.jpeg')] }
    ]
  }
};

export const mockRouteResultOsaka = {
  // 1. [입력 화면용] 검색 조건
  userInput: {
    destination: "일본 오사카",
    startDate: "2024-01-07",
    endDate: "2024-01-10",
    duration: "3박 4일",
    travelers: 2,
    budgetPerPerson: null,
    tags: ["도보", "대중교통", "음식", "쇼핑", "카페"]
  },

  // 2. [경로 결과 화면용] 상세 일정 및 이동 정보
  id: 110,
  schedule: [
    {
      day: 1,
      places: [
        { id: "o1", name: "간사이 공항", time: "11:40 AM", address: "1番地 Senshukukokita, Izumisano, Osaka 549-0001 일본", description: "교통", transport: null },
        { id: "o2", name: "숙소 (체크인)", time: "02:30 PM", address: "2-chōme-6-8 Shimanouchi, Chuo Ward, Osaka, 542-0082 일본", description: "숙소", transport: { type: "기차", duration: "60분" } },
        { id: "o3", name: "스시사카바 사시스", time: "03:00 PM", address: "1 Chome-1-3 Osaka Station 3 Building, B1", description: "식당", transport: { type: "지하철", duration: "20분" } },
        { id: "o4", name: "Amato Maeda Namba-Walk", time: "04:00 PM", address: "1 Chome Sennichimae, Chuo Ward, Osaka, 542-0074 일본", description: "디저트", transport: { type: "지하철", duration: "15분" } },
        { id: "o5", name: "덴덴타운 상점가", time: "04:30 PM", address: "Nipponbashi, Naniwa Ward, Osaka, 556-0005 일본", description: "쇼핑", transport: { type: "도보", duration: "10분" } },
        { id: "o6", name: "숙소 (휴식)", time: "05:00 PM", address: "2-chōme-6-8 Shimanouchi, Chuo Ward, Osaka, 542-0082 일본", description: "숙소", transport: { type: "도보", duration: "15분" } },
        { id: "o7", name: "一夢庵麺 (라멘)", time: "08:00 PM", address: "2 Chome-3-32 Higashishinsaibashi, Chuo Ward, Osaka", description: "식당", transport: { type: "도보", duration: "5분" } },
        { id: "o8", name: "도톤보리", time: "08:30 PM", address: "1 Chome Dotonbori, Chuo Ward, Osaka, 542-0071 일본", description: "관광지", transport: { type: "도보", duration: "10분" } }
      ]
    },
    {
      day: 2,
      places: [
        { id: "o9", name: "숙소 (출발)", time: null, address: "2-chōme-6-8 Shimanouchi, Chuo Ward, Osaka", description: "숙소", transport: null },
        { id: "o10", name: "상등카레 본점", time: "11:30 AM", address: "6 Chome-14-9 Fukushima, Fukushima Ward, Osaka", description: "식당", transport: { type: "지하철", duration: "30분" } },
        { id: "o11", name: "유니클로 링크스 우메다점", time: "12:20 PM", address: "Osaka, Kita Ward, Ofukacho, 1-1 LINKS UMEDA", description: "쇼핑", transport: { type: "도보", duration: "15분" } },
        { id: "o12", name: "다이마루 우메다점", time: "01:20 PM", address: "3 Chome-1-1 Umeda, Kita Ward, Osaka, 530-8202 일본", description: "쇼핑", transport: { type: "도보", duration: "5분" } },
        { id: "o13", name: "KIEFEL (카페)", time: "02:40 PM", address: "Osaka, Kita Ward, Kakudacho, 梅田地下街5-1", description: "카페", transport: { type: "도보", duration: "10분" } },
        { id: "o14", name: "헵파이브", time: "03:30 PM", address: "5-15 Kakudacho, Kita Ward, Osaka, 530-0017 일본", description: "쇼핑", transport: { type: "도보", duration: "5분" } },
        { id: "o15", name: "헵파이브 관람차", time: "05:00 PM", address: "Osaka, Kita Ward, Kakudacho, 5-15 HEP FIVE 7F", description: "관광지", transport: { type: "도보", duration: "0분" } },
        { id: "o16", name: "규카츠 교토가츠규 우메다점", time: "05:30 PM", address: "1 Chome-1-27 Shibata, Kita Ward, Osaka", description: "식당", transport: { type: "도보", duration: "10분" } }
      ]
    },
    {
      day: 3,
      places: [
        { id: "o17", name: "숙소 (출발)", time: null, address: "2-chōme-6-8 Shimanouchi, Chuo Ward, Osaka", description: "숙소", transport: null },
        { id: "o18", name: "난바 고기극장", time: "11:00 AM", address: "2 Chome-4-4 Nanbanaka, Naniwa Ward, Osaka", description: "식당", transport: { type: "지하철", duration: "20분" } },
        { id: "o19", name: "덴덴타운 상점가", time: "12:00 PM", address: "Nipponbashi, Naniwa Ward, Osaka, 556-0005 일본", description: "쇼핑", transport: { type: "도보", duration: "10분" } },
        { id: "o20", name: "난바 야사카 신사", time: "01:30 PM", address: "2 Chome-9-19 Motomachi, Naniwa Ward, Osaka", description: "관광지", transport: { type: "도보", duration: "15분" } },
        { id: "o21", name: "다이마루 신사이바시점", time: "03:00 PM", address: "1 Chome-7-1 Shinsaibashisuji, Chuo Ward, Osaka", description: "쇼핑", transport: { type: "지하철", duration: "15분" } },
        { id: "o22", name: "파르코 신사이바시", time: "04:00 PM", address: "1 Chome-8-3 Shinsaibashisuji, Chuo Ward, Osaka", description: "쇼핑", transport: { type: "도보", duration: "3분" } },
        { id: "o23", name: "후쿠타로", time: "05:30 PM", address: "2 Chome-3-17 Sennichimae, Chuo Ward, Osaka", description: "식당", transport: { type: "도보", duration: "15분" } },
        { id: "o24", name: "글리코사인", time: "06:30 PM", address: "1 Chome-10-4 Dotonbori, Chuo Ward, Osaka", description: "관광지", transport: { type: "도보", duration: "10분" } },
        { id: "o25", name: "돈키호테 도톤보리점", time: "08:00 PM", address: "7-13 Souemoncho, Chuo Ward, Osaka", description: "쇼핑", transport: { type: "도보", duration: "5분" } }
      ]
    },
    {
      day: 4,
      places: [
        { id: "o26", name: "숙소 (체크아웃)", time: null, address: "2-chōme-6-8 Shimanouchi, Chuo Ward, Osaka", description: "숙소", transport: null },
        { id: "o27", name: "플라잉재팬 난바 짐보관", time: "10:50 AM", address: "3 Chome-2-18 Namba, Chuo Ward, Osaka", description: "서비스", transport: { type: "도보", duration: "15분" } },
        { id: "o28", name: "카페 모그 난바점", time: "11:30 AM", address: "Namba, 3-7-9 南華会館빌딩 1F", description: "카페", transport: { type: "도보", duration: "5분" } },
        { id: "o29", name: "간사이 공항", time: "02:00 PM", address: "Izumisano, Osaka 549-0001 일본", description: "교통", transport: { type: "기차", duration: "50분" } }
      ]
    }
  ],

  // 3. [리뷰 화면용] 전체 후기 제목 및 모든 장소별 데이터
  reviewSection: {
    mainTitle: "[3박 4일 오사카 투어] 입과 눈이 모두 즐거운 완벽한 자유여행",
    allReviews: [
      { placeId: "o1", placeName: "간사이 공항", rating: 5, comment: "공항 시설이 깔끔하고 입국 수속도 빨랐어요.", photos: [] },
      { placeId: "o3", placeName: "스시사카바 사시스", rating: 5, comment: "생선 질이 정말 좋고 가격도 합리적입니다.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-09 001.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-09 002.jpeg')] },
      { placeId: "o4", placeName: "Amato Maeda", rating: 4, comment: "달콤한 당고가 쇼핑 중 피로를 싹 가시게 해주네요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-10 003.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-11 004.jpeg')] },
      { placeId: "o5", placeName: "덴덴타운", rating: 5, comment: "피규어와 굿즈가 끝도 없이 펼쳐집니다. 덕후들의 천국!", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-11 005.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-11 006.jpeg')] },
      { placeId: "o7", placeName: "一夢庵麺", rating: 4, comment: "현지인 맛집 느낌! 라멘 국물이 아주 진하고 고소해요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-12 007.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-12 008.jpeg')] },
      { placeId: "o8", placeName: "도톤보리", rating: 5, comment: "밤의 도톤보리는 정말 화려하고 활기가 넘칩니다.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-12 009.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-13 010.jpeg')] },
      { placeId: "o10", placeName: "상등카레", rating: 5, comment: "본점에서 먹는 카레는 역시 다르네요. 풍미가 깊습니다.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-13 011.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-14 012.jpeg')] },
      { placeId: "o11", placeName: "유니클로 링크스 우메다", rating: 5, comment: "매장이 정말 크고 한국에 없는 제품도 많아서 쇼핑하기 최고예요!", photos: [] },
      { placeId: "o12", placeName: "다이마루 우메다", rating: 4, comment: "포켓몬 센터랑 닌텐도 샵 구경하느라 정신없었네요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-15 013.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-16 014.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-16 015.jpeg')] },
      { placeId: "o13", placeName: "KIEFEL", rating: 4, comment: "고전적인 분위기에서 즐기는 달콤한 파르페가 좋았습니다.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-16 016.jpeg')] },
      { placeId: "o14", placeName: "헵파이브", rating: 4, comment: "트렌디한 브랜드가 많고 쇼핑 동선이 편해요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-17 017.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-17 018.jpeg')] },
      { placeId: "o15", placeName: "헵파이브 관람차", rating: 5, comment: "우메다 야경을 보기에 가장 가성비 좋은 선택!", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-17 019.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-18 020.jpeg')] },
      { placeId: "o16", placeName: "규카츠 교토가츠규", rating: 5, comment: "개인 화로에 구워 먹는 재미와 부드러운 고기 맛이 일품입니다.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-19 021.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-19 022.jpeg')] },
      { placeId: "o18", placeName: "난바 고기극장", rating: 5, comment: "치맛살 덮밥의 소스 맛이 자꾸 생각날 것 같아요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-34 001.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-35 002.jpeg')] },
      { placeId: "o19", placeName: "덴덴타운", rating: 5, comment: "어제 못 본 골목까지 구경했는데 역시나 볼 게 많네요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-35 003.jpeg')] },
      { placeId: "o20", placeName: "난바 야사카 신사", rating: 5, comment: "웅장한 사자 머리가 압권입니다. 오사카 오면 꼭 가보세요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-36 004.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-40 005.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-41 006.jpeg')] },
      { placeId: "o21", placeName: "다이마루 신사이바시", rating: 4, comment: "명품 매장부터 캐릭터 샵까지 고급스러운 분위기가 좋네요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-42 007.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-42 008.jpeg')] },
      { placeId: "o22", placeName: "파르코 신사이바시", rating: 5, comment: "스누피 샵이랑 무민 샵 등 귀여운 굿즈가 정말 많습니다.", photos: [] },
      { placeId: "o23", placeName: "후쿠타로", rating: 5, comment: "네기야끼가 정말 고소하고 맛있어요. 기다린 보람이 있네요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-42 009.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-43 010.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-44 011.jpeg')] },
      { placeId: "o24", placeName: "글리코사인", rating: 5, comment: "오사카 여행의 꽃! 사진 백 장 찍고 갑니다.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-45 012.jpeg')] },
      { placeId: "o25", placeName: "돈키호테 도톤보리", rating: 4, comment: "마지막 쇼핑 털기! 면세 혜택 꼭 챙기세요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-46 013.jpeg')] },
      { placeId: "o27", placeName: "플라잉재팬 짐보관", rating: 5, comment: "짐 맡기고 가볍게 마지막 일정 소화하기 딱 좋았습니다.", photos: [] },
      { placeId: "o28", placeName: "카페 모그", rating: 5, comment: "폭신폭신한 수플레 팬케이크가 여행의 피로를 녹여주네요.", photos: [require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-46 014.jpeg'), require('../../assets/images/reviews/osaka/KakaoTalk_Photo_2026-04-28-19-34-47 015.jpeg')] },
      { placeId: "o29", placeName: "간사이 공항", rating: 5, comment: "아쉽지만 즐거웠던 3박 4일, 다시 오고 싶어요!", photos: [] }
    ]
  }
};

export const mockRouteResultSapporo = {
  // 1. [입력 화면용] 검색 조건
  userInput: {
    destination: "일본 삿포로",
    startDate: "2024-01-09",
    endDate: "2024-01-12",
    duration: "3박 4일",
    travelers: 2,
    budgetPerPerson: null,
    tags: ["도보", "대중교통", "사진", "음식"]
  },

  // 2. [경로 결과 화면용] 상세 일정 및 이동 정보
  id: 109,
  schedule: [
    {
      day: 1,
      places: [
        { id: "p1", name: "신치토세 공항", time: "02:00 PM", address: "Bibi, Chitose, Hokkaido 066-0012 일본", description: "교통", transport: null },
        { id: "p2", name: "삿포로역", time: "03:00 PM", address: "4 Chome Kita 6 Jonishi, Kita Ward, Sapporo, Hokkaido 060-0806 일본", description: "교통", transport: { type: "기차", duration: "40분" } },
        { id: "p3", name: "TV타워", time: "03:30 PM", address: "1 Chome Odorinishi, Chuo Ward, Sapporo, Hokkaido 060-0042 일본", description: "관광지", transport: { type: "도보", duration: "15분" } },
        { id: "p4", name: "베셀호텔 캄파나 스스키노", time: "04:00 PM", address: "6 Chome-16番地1 Minami 5 Jonishi, Chuo Ward, Sapporo", description: "숙소", transport: { type: "지하철", duration: "10분" } },
        { id: "p5", name: "아지노히츠지가오카_징기스칸", time: "05:00 PM", address: "4 Chome-5-25 Minami 6 Jonishi, Chuo Ward, Sapporo", description: "식당", transport: { type: "도보", duration: "5분" } },
        { id: "p6", name: "니카 위스키 사인", time: "05:40 PM", address: "Hokkaido, Sapporo, Chuo Ward, すすきの南四条西三丁目", description: "관광지", transport: { type: "도보", duration: "5분" } },
        { id: "p7", name: "삿포로 파르코", time: "06:00 PM", address: "3 Chome-3 Minami 1 Jonishi, Chuo Ward, Sapporo", description: "쇼핑", transport: { type: "도보", duration: "10분" } }
      ]
    },
    {
      day: 2,
      places: [
        { id: "p8", name: "숙소 (출발)", time: null, address: "6 Chome-16番地1 Minami 5 Jonishi, Chuo Ward, Sapporo", description: "숙소", transport: null },
        { id: "p9", name: "삿포로역", time: "10:00 AM", address: "4 Chome Kita 6 Jonishi, Kita Ward, Sapporo", description: "교통", transport: { type: "지하철", duration: "15분" } },
        { id: "p10", name: "미나미오타루역", time: "11:00 AM", address: "11 Sumiyoshichō, Otarun, Hokkaido 047-0015 일본", description: "교통", transport: { type: "기차", duration: "45분" } },
        { id: "p11", name: "로쿠미안", time: "11:20 AM", address: "8-18 Sumiyoshicho, Otaru, Hokkaido 047-0015 일본", description: "식당", transport: { type: "도보", duration: "5분" } },
        { id: "p12", name: "오르골당", time: "12:00 PM", address: "4-1 Sumiyoshicho, Otaru, Hokkaido 047-0015 일본", description: "쇼핑", transport: { type: "도보", duration: "10분" } },
        { id: "p13", name: "유니클로 오타루점", time: "01:00 PM", address: "2-7 Sumiyoshicho, Otaru, Hokkaido 047-0015 일본", description: "쇼핑", transport: { type: "도보", duration: "10분" } },
        { id: "p14", name: "르타오 파토스", time: "02:00 PM", address: "5-22 Sakaimachi, Otaru, Hokkaido 047-0027 일본", description: "베이커리", transport: { type: "도보", duration: "10분" } },
        { id: "p15", name: "스누피 차야 오타루점", time: "02:30 PM", address: "Hokkaido, Otaru, Sakaimachi, 6−4 １F", description: "쇼핑", transport: { type: "도보", duration: "5분" } },
        { id: "p16", name: "사와와 오타루점", time: "03:00 PM", address: "4-14 Sakaimachi, Otaru, Hokkaido 047-0027 일본", description: "카페", transport: { type: "도보", duration: "5분" } },
        { id: "p17", name: "오타루 운하", time: "03:30 PM", address: "Minatomachi, Otaru, Hokkaido 047-0007 일본", description: "관광지", transport: { type: "도보", duration: "10분" } },
        { id: "p18", name: "수프카레 킹 센트럴점", time: "06:00 PM", address: "Hokkaido, Sapporo, Chuo Ward, Minami 2 Jonishi, 3-13-4", description: "식당", transport: { type: "기차/지하철", duration: "60분" } },
        { id: "p19", name: "숙소 (휴식)", time: "06:30 PM", address: "6 Chome-16番地1 Minami 5 Jonishi, Chuo Ward, Sapporo", description: "숙소", transport: { type: "도보", duration: "10분" } },
        { id: "p20", name: "메가 돈키호테 삿포로", time: "08:30 PM", address: "4 Chome-12-1 Minami 3 Jonishi, Chuo Ward, Sapporo", description: "쇼핑", transport: { type: "도보", duration: "10분" } },
        { id: "p21", name: "테시카가라멘 요코쵸점", time: "10:30 PM", address: "Hokkaido, Sapporo, Chuo Ward, Minami 5 Jonishi, 3 Chome", description: "식당", transport: { type: "도보", duration: "5분" } }
      ]
    },
    {
      day: 3,
      places: [
        { id: "p22", name: "숙소 (출발)", time: null, address: "6 Chome-16番地1 Minami 5 Jonishi, Chuo Ward, Sapporo", description: "숙소", transport: null },
        { id: "p23", name: "삿포로역 (버스투어 시작)", time: "08:30 AM", address: "4 Chome Kita 6 Jonishi, Kita Ward, Sapporo", description: "교통", transport: { type: "지하철", duration: "15분" } },
        { id: "p24", name: "탁신관", time: "11:00 AM", address: "Hokkaido, Kamikawa District, Biei, 字拓進", description: "관광지", transport: { type: "버스", duration: "150분" } },
        { id: "p25", name: "흰수염폭포", time: "12:00 PM", address: "Shirogane, Biei, Kamikawa District, Hokkaido", description: "관광지", transport: { type: "버스", duration: "30분" } },
        { id: "p26", name: "캔과메리나무", time: "01:00 PM", address: "Hokkaido, Kamikawa District, Biei, 大久보협생", description: "관광지", transport: { type: "버스", duration: "20분" } },
        { id: "p27", name: "다이마루 (카레우동)", time: "01:30 PM", address: "1 Chome-7-2 Nakamachi, Biei", description: "식당", transport: { type: "버스", duration: "10분" } },
        { id: "p28", name: "크리스마스 나무", time: "03:00 PM", address: "Bibaushi, Biei, Kamikawa District, Hokkaido", description: "관광지", transport: { type: "버스", duration: "30분" } },
        { id: "p29", name: "닝구르 테라스", time: "04:30 PM", address: "Nakagoryo, Furano, Hokkaido 076-8511 일본", description: "관광지", transport: { type: "버스", duration: "40분" } },
        { id: "p30", name: "원조 데카모리 카이센동야", time: "05:30 PM", address: "Hokkaido, Sapporo, Chuo Ward, Minami 6 Jonishi, 3-10-1", description: "식당", transport: { type: "버스", duration: "120분" } }
      ]
    },
    {
      day: 4,
      places: [
        { id: "p31", name: "숙소 (체크아웃)", time: null, address: "6 Chome-16番地1 Minami 5 Jonishi, Chuo Ward, Sapporo", description: "숙소", transport: null },
        { id: "p32", name: "신치토세 공항", time: "10:20 AM", address: "Bibi, Chitose, Hokkaido 066-0012 일본", description: "교통", transport: { type: "기차", duration: "60분" } }
      ]
    }
  ],

  // 3. [리뷰 화면용] 전체 후기 제목 및 모든 장소별 데이터
  reviewSection: {
    mainTitle: "[3박 4일 삿포로 여행] 설국에서 즐기는 완벽한 겨울 휴가",
    allReviews: [
      { placeId: "p1", placeName: "신치토세 공항", rating: 5, comment: "공항부터 홋카이도 감성이 느껴져요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-33 001.jpeg')] },
      { placeId: "p2", placeName: "삿포로역", rating: 4, comment: "사람이 많지만 길 찾기는 어렵지 않았습니다.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-34 002.jpeg')] },
      { placeId: "p3", placeName: "TV타워", rating: 4, comment: "공원과 어우러진 모습이 예뻐요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-34 003.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-34 004.jpeg')] },
      { placeId: "p4", placeName: "베셀호텔", rating: 5, comment: "호실도 깔끔하고 조식이 정말 훌륭합니다.", photos: [] },
      { placeId: "p5", placeName: "아지노히츠지가오카", rating: 5, comment: "징기스칸의 정석, 고기가 정말 신선해요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-35 005.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-35 006.jpeg')] },
      { placeId: "p6", placeName: "니카 위스키 사인", rating: 5, comment: "스스키노의 상징! 밤에 보니 더 화려하네요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-35 007.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-35 008.jpeg')] },
      { placeId: "p7", placeName: "삿포로 파르코", rating: 4, comment: "지브리 샵 구경하는 재미가 쏠쏠했습니다.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-36 009.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-36 010.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-36 011.jpeg')] },
      { placeId: "p8", placeName: "숙소", rating: 5, comment: "둘째 날 아침 상쾌하게 출발!", photos: [] },
      { placeId: "p11", placeName: "로쿠미안", rating: 4, comment: "오타루에서의 깔끔한 첫 식사.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-36 012.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-37 013.jpeg')] },
      { placeId: "p12", placeName: "오르골당", rating: 5, comment: "반짝이는 오르골 소리가 낭만적이에요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-37 014.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-38 015.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-38 016.jpeg')] },
      { placeId: "p14", placeName: "르타오 파토스", rating: 5, comment: "치즈케이크가 입안에서 사르르 녹아요.", photos: [] },
      { placeId: "p17", placeName: "오타루 운하", rating: 5, comment: "눈 내리는 운하 풍경은 평생 못 잊을 것 같아요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-40 021.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-40 022.jpeg')] },
      { placeId: "p18", placeName: "수프카레 킹", rating: 5, comment: "삿포로 오면 수프카레는 필수! 국물이 깊어요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-41 025.jpeg')] },
      { placeId: "p20", placeName: "돈키호테", rating: 4, comment: "쇼핑하기엔 좋지만 사람이 너무 많아 기 빨리네요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-41 026.jpeg')] },
      { placeId: "p21", placeName: "테시카가라멘", rating: 5, comment: "요코쵸 골목의 분위기와 진한 라멘 국물이 일품.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-42 027.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-32-42 028.jpeg')] },
      { placeId: "p24", placeName: "탁신관", rating: 5, comment: "자작나무 숲길이 정말 평화롭고 예뻐요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-39 001.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-39 002.jpeg')] },
      { placeId: "p25", placeName: "흰수염폭포", rating: 5, comment: "푸른 물빛과 얼음이 어우러진 신비로운 모습.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-40 003.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-40 004.jpeg')] },
      { placeId: "p27", placeName: "다이마루", rating: 4, comment: "카레우동과 튀김의 조화가 훌륭합니다.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-41 006.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-42 007.jpeg')] },
      { placeId: "p28", placeName: "크리스마스 나무", rating: 5, comment: "눈밭 위에 홀로 선 모습이 동화 같아요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-42 008.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-42 009.jpeg')] },
      { placeId: "p29", placeName: "닝구르 테라스", rating: 5, comment: "요정의 마을 같은 아기자기한 상점들이 귀여워요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-43 010.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-43 011.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-44 012.jpeg')] },
      { placeId: "p30", placeName: "데카모리 카이센동야", rating: 5, comment: "해산물이 산더미처럼 쌓여 나와서 깜짝 놀랐어요.", photos: [require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-44 013.jpeg'), require('../../assets/images/reviews/satporo/KakaoTalk_Photo_2026-04-28-19-33-44 014.jpeg')] },
      { placeId: "p32", placeName: "신치토세 공항", rating: 5, comment: "안녕 삿포로, 또 올게!", photos: [] }
    ]
  }
};

export const mockRouteResultJeju = {
  userInput: {
    destination: "제주도",
    startDate: "2025-02-21",
    endDate: "2025-02-23",
    duration: "2박 3일",
    travelers: 2,
    budgetPerPerson: null,
    tags: ["도보", "자동차", "사진", "음식", "힐링"]
  },
  id: 111,
  schedule: [
    {
      day: 1,
      places: [
        { id: "j1", name: "도두봉 전망대", time: "11:00 AM", address: "제주 제주시 도두일동 산1", description: "관광지", transport: null },
        { id: "j2", name: "이재모피자 제주점", time: "01:00 PM", address: "제주 제주시 연북로 257", description: "식당", transport: { type: "자동차", duration: "20분" } },
        { id: "j3", name: "우진해장국", time: "06:00 PM", address: "제주 제주시 서사로 11", description: "식당", transport: { type: "자동차", duration: "15분" } }
      ]
    },
    {
      day: 2,
      places: [
        { id: "j4", name: "제주 해조네 보말성게 전문점", time: "10:00 AM", address: "제주 서귀포시 대정읍 신청로 13", description: "식당", transport: null },
        { id: "j5", name: "카멜리아힐", time: "01:30 PM", address: "제주 서귀포시 안덕면 병악로 166", description: "관광지", transport: { type: "자동차", duration: "25분" } },
        { id: "j6", name: "연돈", time: "07:00 PM", address: "제주 서귀포시 일주서로 968-10", description: "식당", transport: { type: "자동차", duration: "30분" } }
      ]
    },
    {
      day: 3,
      places: [
        { id: "j7", name: "화성식당", time: "11:30 AM", address: "제주 제주시 일주동로 383", description: "식당", transport: null }
      ]
    }
  ],
  reviewSection: {
    mainTitle: "2025년 겨울 가족들과 제주도 여행",
    allReviews: [
      { placeId: "j1", placeName: "도두봉 전망대", rating: 4, comment: "겨울에 와서 좀 더 푸릇푸릇한 사진을 못찍은게 아쉽지만 가볍게 올라오기 좋았어요 엄청 높지도 않고, 바람면서 경치 구경하기 너무 좋았습니다!", photos: [] },
      { placeId: "j2", placeName: "이재모피자", rating: 5, comment: "부산에서는 줄이 워낙 길어서 제주도 놀러온 김에 먹었는데 왜 칭찬하는지 알겠어요! 치즈가 다른 피자집들하고는 정말 달라서 감동이었어요..", photos: ["https://picsum.photos/200/200?random=111"] },
      { placeId: "j3", placeName: "우진 해장국", rating: 4, comment: "되게 익숙한 맛이었어요! 약간 육계장 스타일! 닭고기가 들어가있는 줄 모르고 먹었는데 육계장 맛 나서 되게 친숙했고 밑반찬도 다 맛있었어요.", photos: ["https://picsum.photos/200/200?random=112"] },
      { placeId: "j4", placeName: "제주 해조네 보말성게 전문점", rating: 5, comment: "보말을 진짜 먹어보고 싶었는데 보말죽이 정말 맛있었어요!! 비빔밥도 맛있는데 확실히 보말의 맛을 제대로 느끼려면 죽이 최고인 것 같아요", photos: ["https://picsum.photos/200/200?random=113"] },
      { placeId: "j5", placeName: "카멜리아힐", rating: 3, comment: "저는 동백꽃 시즌이 지나서 온 바람에 너무 아쉬웠어요ㅜㅜ 다른 꽃들 보고 산책하면서 즐거웠지만, 동백꽃을 보고 싶었는데 너무 아쉬웠습니다. 다음에는 시즌일 때 오고 싶어요!", photos: [] },
      { placeId: "j6", placeName: "연돈", rating: 5, comment: "백종원의 골목식당에서 나온 유명한 집인데, 솔직히 뭐가 다를까 싶었지만 엄청 맛있어서 놀랬어요. 튀김옷에 간이 베어있어 느끼함이 없고 정말 만족스러운 집이었어요!", photos: ["https://picsum.photos/200/200?random=114"] },
      { placeId: "j7", placeName: "화성식당", rating: 3, comment: "웨이팅을 좀 길게 해서 기대를 했는데 생각보다 평범한 맛이었어요. 접착뼈국이라 신기하긴 했지만 굳이 오래 기다려서 먹을 정도는 아닌 것 같아요.", photos: [] }
    ]
  }
};

export const mockRouteResultPhuQuoc = {
  userInput: {
    destination: "베트남 푸꾸옥",
    startDate: "2024-09-27",
    endDate: "2024-09-29",
    duration: "2박 3일",
    travelers: 2,
    budgetPerPerson: null,
    tags: ["도보", "음식", "사진", "체험"]
  },
  id: 112,
  schedule: [
    {
      day: 1,
      places: [
        { id: "q1", name: "페퍼스파", time: "01:00 PM", address: "Phú Quốc, Kien Giang, Vietnam", description: "마사지", transport: null },
        { id: "q2", name: "빈펄 사파리(Vinpearl Safari)", time: "03:00 PM", address: "Gành Dầu, Phú Quốc, Kien Giang 920000 베트남", description: "관광지", transport: { type: "트램", duration: "20분" } },
        { id: "q3", name: "기린 레스토랑(Giraffe restaurant)", time: "04:30 PM", address: "Vinpearl Safari, Phú Quốc", description: "식당", transport: { type: "도보", duration: "5분" } },
        { id: "q4", name: "프리미어 빌리지 푸꾸옥 리조트", time: "06:30 PM", address: "Ong Doi Cape, An Thoi Ward, Phu Quoc City", description: "숙소", transport: { type: "트램", duration: "40분" } }
      ]
    },
    {
      day: 2,
      places: [
        { id: "q5", name: "앙스파", time: "11:00 AM", address: "Phu Quoc, Vietnam", description: "마사지", transport: null },
        { id: "q6", name: "킹콩 마트", time: "02:00 PM", address: "141A Đường Trần Hưng Đạo, Dương Tơ, Phú Quốc", description: "쇼핑", transport: { type: "도보", duration: "15분" } },
        { id: "q7", name: "선셋타운 키스브릿지", time: "06:00 PM", address: "Sunset Town, An Thoi, Phu Quoc", description: "관광지", transport: { type: "자동차", duration: "20분" } }
      ]
    },
    {
      day: 3,
      places: [
        { id: "q8", name: "앙스파", time: "10:30 AM", address: "Phu Quoc, Vietnam", description: "마사지", transport: null },
        { id: "q9", name: "하이 산 캉(Hai san cang)", time: "01:00 PM", address: "An Thoi, Phu Quoc, Kien Giang", description: "식당", transport: { type: "자동차", duration: "15분" } },
        { id: "q10", name: "메오 키친", time: "06:00 PM", address: "Phu Quoc, Vietnam", description: "식당", transport: { type: "자동차", duration: "10분" } }
      ]
    }
  ],
  reviewSection: {
    mainTitle: "[2박 3일 푸꾸옥 여행] 남부 섬 투어와 완벽한 호캉스",
    allReviews: [
      { placeId: "q1", placeName: "페퍼스파", rating: 4, comment: "센 마사지 받고 싶으신 분들은 만족 못하실 수 있어요. 처음이라 약하게 했는데 간지러워서 힘들었네요. 강으로 받는 걸 추천드려요.", photos: [] },
      { placeId: "q2", placeName: "빈펄 사파리(Vinpearl Safari)", rating: 5, comment: "평소 보지 못하는 동물들을 많이 보고 왔어요! 트램 티켓 구매하면 직원분들이 태워주시고 재밌는 요소가 많았습니다.", photos: ["https://picsum.photos/200/200?random=121"] },
      { placeId: "q3", placeName: "기린 레스토랑(Giraffe restaurant)", rating: 5, comment: "기린 보면서 먹는 퀄리티 좋은 식당! 냄새 걱정했는데 안쪽 좌석 아니면 괜찮아요. 사파리 오면 점심은 여기서 드세요!", photos: ["https://picsum.photos/200/200?random=122"] },
      { placeId: "q4", placeName: "프리미어 빌리지 푸꾸옥 리조트", rating: 5, comment: "제발 이곳으로 가세요. 직원분들도 다정하고 방 퀄리티, 풀장 전부 완벽해요. 제대로 된 호캉스를 즐기고 싶다면 강력 추천!", photos: ["https://picsum.photos/200/200?random=123"] },
      { placeId: "q5", placeName: "앙스파", rating: 5, comment: "한국인 사장님이셔서 소통이 편하고 강도가 세서 정말 시원해요!", photos: ["https://picsum.photos/200/200?random=124"] },
      { placeId: "q6", placeName: "킹콩 마트", rating: 5, comment: "푸꾸옥의 다이소 느낌! 선물용이나 간식 사기 좋으니 동선 맞으면 꼭 들르세요. 도난 방지용 트랩이 인상적이에요.", photos: [] },
      { placeId: "q7", placeName: "선셋타운 키스브릿지", rating: 5, comment: "불꽃놀이와 물 퍼포먼스가 정말 재밌었어요. 예쁘고 낭만적인 장소였습니다.", photos: ["https://picsum.photos/200/200?random=125"] },
      { placeId: "q8", placeName: "앙스파", rating: 5, comment: "남부에 계실 거라면 꼭 가세요! 고수들이 좋아할 만한 악력입니다. 아픈 걸 못 참으시면 약하게 요청하세요.", photos: [] },
      { placeId: "q9", placeName: "하이 산 캉(Hai san cang)", rating: 4, comment: "해산물 잔뜩 먹기 좋은 곳! 새우, 게 전부 맛있었어요. 음식 나오는 시간은 좀 걸리지만 맛있어서 용서됩니다.", photos: ["https://picsum.photos/200/200?random=126"] },
      { placeId: "q10", placeName: "메오 키친", rating: 5, comment: "직원분들 정말 친절하고 강아지들도 귀여워요! 음식도 맛있고 깔끔하게 챙겨주셔서 다시 들르고 싶은 곳입니다.", photos: ["https://picsum.photos/200/200?random=127"] }
    ]
  }
};

// (선택) 여러 개를 한 번에 불러오기 쉽게 배열로 묶어두셔도 좋습니다. 나중에 '나의 후기 기록 목록' 화면 띄울 때 유용해요!
export const allMockRoutes = [
  mockRouteResultBusan,
  mockRouteResultDaegu,
  mockRouteResultDaejeon,
  mockRouteResultMungyeong,
  mockRouteResultOsaka,
  mockRouteResultSapporo,
  mockRouteResultJeju,
  mockRouteResultPhuQuoc,
];

// 백엔드 API 대신 프론트에서 쓸 새로운 LLM 응답 포맷의 더미 데이터
export const mockApiData = {
  places: [
    { name: "도두봉 전망대", lat: 33.5098, lng: 126.4678, reason: "멋진 경치", category: "관광지", duration: 60 },
    { name: "우진해장국", lat: 33.5115, lng: 126.5200, reason: "유명한 해장국", category: "식당", duration: 60 },
    { name: "카멜리아힐", lat: 33.2900, lng: 126.3683, reason: "아름다운 동백꽃", category: "관광지", duration: 120 }
  ],
  route_segments: [
    {
      from_name: "도두봉 전망대",
      to_name: "우진해장국",
      routes: { "drive": { "duration_minutes": 15, "polyline": [[33.5098,126.4678], [33.5115,126.5200]] } }
    },
    {
      from_name: "우진해장국",
      to_name: "카멜리아힐",
      routes: { "drive": { "duration_minutes": 45, "polyline": [[33.5115,126.5200], [33.2900,126.3683]] } }
    }
  ]
};
