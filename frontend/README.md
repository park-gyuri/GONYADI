## 📂 프로젝트 구조
- `frontend/gonyadi-app/`: React Native (Expo go 또는 Android Studio Emulator로 실행)
- `frontend/gonyadi-app/scr/screens`: UI 화면과 기능
- `frontend/gonyadi-app/scr/components`: 재사용 가능한 컴포넌트 (모달 팝업, 아이콘 등)
- `frontend/gonyadi-app/app/(tabs)`: 화면간 이동 네비게이션 역할 (Expo router시스템)


---

## 🛠️ 필수 준비물 (Prerequisites)
프로젝트를 실행하기 전, 아래 도구들이 설치되어 있어야 한다!

1. **Node.js:** [공식 홈페이지(LTS 버전)](https://nodejs.org/) 설치 (npm 포함)
2. **Android Studio & JDK:** 안드로이드 에뮬레이터 실행 및 빌드를 위해 필요
3. **Expo Go 앱:** 실물 스마트폰에서 테스트하려면 필수 (Play Store / App Store)
4. 아마 파이썬도 설치해야 할 것 같음.. 난 원래 있긴한데 있어야 할 듯..

---

## 🚀 프론트엔드 시작하기 (Frontend Setup)

### 1. 의존성 라이브러리 설치
프로젝트를 처음 클론 받았다면, `node_modules` 폴더를 생성하기 위해 아래 명령어를 **꼭** 먼저 실행해야 합니다.
```bash
cd frontend/gonyadi-app
npm install
```

### 2. 프로젝트 실행
```bash
# 레포지토리 클론
git clone [레포지토리 주소]
cd GONYADI/frontend/gonyadi-app

# 의존성 라이브러리 설치 했나요?
npm install

# 현재 gonyadi-app 폴더인지 확인하고, Expo 서버 실행
# 큐알코드 찍어서 작업 상황 실시간 확인 가능
npx expo start
# start 뒤에 -c 를 붙이면 실행했던 캐시 삭제 후 실행
# 종료는 cntrl + c

# git에 클론하기
git checkout -b 작업자성/기능
git add .
# . 또는 파일 이름
git commit -m "작성 규칙에 맞춰 적기"
git push origin 작업자성/기능
# 이 부분은 기존 README에 있던 내용. 다시 기록용 적어둔 것

## 🛠 필수 준비물 (Prerequisites)
프로젝트를 실행하기 전에 아래 환경이 세팅되어 있어야 합니다.

1. **Node.js 설치:** [Node.js 공식 홈페이지](https://nodejs.org/)에서 LTS 버전을 다운로드하고 설치해 주세요.
2. **테스트 기기 준비:**
   * **실물 스마트폰:** 앱 스토어(또는 플레이스토어)에서 **Expo Go** 앱을 다운로드해 주세요.
   * **PC 에뮬레이터 (선택):** iOS Simulator(Mac 전용) 또는 Android Studio Emulator가 필요합니다.
# 우리는 안드로이드 개발이기에 Android Studio Emulator를 사용
# 이와 관련된 비슷한 내용은 Frontend/gonyadi-app/README.md에 자동 생성되어 있으니 참고 (but 영어임)