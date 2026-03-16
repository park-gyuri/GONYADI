from passlib.context import CryptContext
from dotenv import load_dotenv
import os


# 1. 암호화 알고리즘을 Bcrypt로 설정
password_hasher = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. 평문 비밀번호를 해시로 바꾸는 함수 (회원가입 시 사용)
def change_password_hash(password: str) -> str:
    return password_hasher.hash(password)

# 3. 입력한 비번이 저장된 해시와 일치하는지 확인하는 함수 (로그인 시 사용)
def verify_password(input_password: str, hashed_password: str) -> bool:
    return password_hasher.verify(input_password, hashed_password)



load_dotenv()

# --- JWT 토큰 ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 토큰 유효 기간 (예: 24시간)

# 토큰 발행 함수
def create_access_token(data: dict, expiration_period: Optional[timedelta] = None):
    payload = data.copy()

    # 1. 유효기간 계산 (직접 지정값이 없으면 기본 24시간 적용)
    if expiration_period:
        expire = datetime.utcnow() + expiration_period
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 2. 페이로드(내용물)에 만료 시간 추가
    payload.update({"exp": expire})

    # 3. 내용 + 비밀키 + 알고리즘을 섞어서 최종 JWT 문자열 생성
    acccess_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return accsess_token

# 토큰 검증 함수
def verify_access_token(token: str):
    try: 
        payload = jwt.decode(token, SECREY_KEY, algorithms=[ALCORITHM])
        return payload
    except JWTError:
        return None