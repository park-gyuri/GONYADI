from dotenv import load_dotenv
import os
from sqlmodel import create_engine, Session

load_dotenv()

# DATABASE_URL 직접 지정 시 우선 사용 (Supabase 등 외부 DB)
# 없으면 개별 환경변수로 조합 (로컬 Docker)
DATABASE_URL = os.getenv("DATABASE_URL")

# SQLAlchemy 2.0 doesn't support 'postgres://', so we replace it with 'postgresql://'
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    DB_USER     = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME     = os.getenv("DB_NAME")
    DB_HOST     = os.getenv("DB_HOST", "localhost")
    DB_PORT     = os.getenv("DB_PORT", "5432")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Supabase 및 외부 DB는 SSL 필수
# localhost / 127.0.0.1이 아닌 호스트면 SSL 활성화
_is_remote = not any(h in DATABASE_URL for h in ["localhost", "127.0.0.1"])
connect_args = {"sslmode": "require"} if _is_remote else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args, pool_pre_ping=True)

def get_session():
    with Session(engine) as session:
        yield session