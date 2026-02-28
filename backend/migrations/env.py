import sys
import os
from dotenv import load_dotenv
from models import User

from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from sqlmodel import SQLModel 

# 환경 설정 로드
sys.path.append(os.getcwd())
load_dotenv()

# alembic.ini의 설정값(설계 기본 지침서)들을 읽어오기
config = context.config

# DB 접속 정보 변경
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost:5432/{os.getenv('DB_NAME')}"
print(f"DEBUG: 생성된 주소는 -> {DATABASE_URL}")
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# 터미널에 로그 (형식에 맞게) 띄우기
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 모델의 메타데이터를 연결
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """오프라인 모드에서 실행
    실제 DB 연결 없이 SQL 쿼리문 파일만 생성하고 싶을 때 사용
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """온라인 모드에서 실행
    실제 DB에 접속하여 테이블을 생성하거나 변경할 때 사용
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
