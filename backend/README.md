########## 실행 가이드 ##########

```bash
cd backend
py -3.13.9 -m venv venv # 가상환경 생성
source venv/Scripts/activate # 가상환경 활성화

pip install -r requirements.txt # 의존성 설치

.env 파일 생성 #.env.example 파일 내용 붙여넣은 후 키 값 넣기

uvicorn main:app --reload # 서버 실행


########## 프로젝트 관리 ##########

pip freeze > requirements.txt # 설치 패키지 관리
