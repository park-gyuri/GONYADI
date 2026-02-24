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




########## 데이터베이스 관리 ##########

# DB 서버 실행
docker-compose up -d

# 버전 관리
# 1. models.py 파일 코드에 필드 추가
# 2. migration 파일 생성
alembic revision --autogenerate -m "message"
# 3. DB에 실제 반영
alembic upgrade head



