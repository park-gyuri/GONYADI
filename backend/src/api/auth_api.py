from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.user_schema import UserCreate, UserLogin
from src.core.security import verify_password, create_access_token
import src.crud.user_crud as user_crud
import random
from src.models.auth import EmailVerification
from src.services.email_service import send_verification_email
from sqlmodel import select
from datetime import datetime
from email_validator import validate_email, EmailNotValidError


router = APIRouter(prefix="/auth", tags=["auth"])

#회원가입
@router.post("/register")
def register(
    user_input: UserCreate,
    session:    Session = Depends(get_session),
):
    # 1. 이미 가입된 이메일인지 확인
    if user_crud.get_user_by_email(user_input.user_email, session):
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")

    # 2. 이메일 인증 완료 여부 확인
    # 해당 이메일로 '사용됨(is_used=True)' 상태인 인증 기록이 있는지 확인합니다.
    statement = select(EmailVerification).where(
        EmailVerification.email == user_input.user_email,
        EmailVerification.is_used == True
    )
    verification = session.exec(statement).first()

    if not verification:
        raise HTTPException(status_code=400, detail="이메일 인증이 완료되지 않았습니다.")

    # 3. 회원가입 처리
    new_user = user_crud.create_user(user_input, session)
    return {
        "message": "회원가입이 성공적으로 완료되었습니다.",
        "user": new_user
    }


@router.post("/send-verification")
def send_verification(email: str, session: Session = Depends(get_session)):
    # 1. 이메일 형식 검증 (커스텀 메시지)
    try:
        # check_deliverability=True로 설정하면 실제 존재하는 도메인인지 체크합니다.
        validate_email(email, check_deliverability=True)
    except EmailNotValidError:
        raise HTTPException(
            status_code=400, 
            detail="이메일 형식이 올바르지 않습니다. ex) aaa@bbb.com"
        )

    # 2. 6자리 난수 생성
    code = f"{random.randint(100000, 999999)}"
    print(f"DEBUG: 생성된 인증 코드: {code} (대상: {email})")
    
    # 3. 메일 발송 시도
    success = send_verification_email(email, code)
    
    if not success:
        # 실제 운영 환경(SMTP 설정 있음)에서 발송 실패한 경우
        from src.services.email_service import SMTP_USER
        if SMTP_USER:
             raise HTTPException(status_code=400, detail="존재하지 않는 이메일이거나 발송에 실패했습니다.")
        else:
            # 개발 환경(SMTP 설정 없음)에서는 터미널에 띄워주고 진행 허용
            print(f"DEBUG: [인증 코드: {code}] (SMTP 설정이 없어 터미널에 출력합니다)")

    # 4. 발송이 성공했거나 개발 환경인 경우에만 DB에 저장
    try:
        verification = EmailVerification(email=email, code=code)
        session.add(verification)
        session.commit()
        print("DEBUG: DB 저장 완료!")
    except Exception as db_err:
        print(f"[ERROR] DB 저장 중 에러 발생: {db_err}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"DB 에러: {str(db_err)}")
    
    return {"message": "인증 코드가 발송되었습니다."}


@router.post("/verify-code")
def verify_code(email: str, code: str, session: Session = Depends(get_session)):
    statement = select(EmailVerification).where(
        EmailVerification.email == email,
        EmailVerification.code == code,
        EmailVerification.is_used == False,
        EmailVerification.expire_at > datetime.now()
    ).order_by(EmailVerification.created_at.desc())
    
    verification = session.exec(statement).first()
    
    if not verification:
        raise HTTPException(status_code=400, detail="인증 번호가 틀렸거나 만료되었습니다.")
    
    # 인증 성공 처리
    verification.is_used = True
    session.add(verification)
    session.commit()
    
    return {"message": "인증에 성공했습니다."}



# 로그인
@router.post("/login")
def login(
    user_input: UserLogin,
    session:    Session = Depends(get_session),
):
    # 1. 아이디로 유저 찾기
    user = user_crud.get_user_by_id(user_input.user_id, session)
    if user is None:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")

    # 2. 비밀번호 확인
    if not verify_password(user_input.user_password, user.user_password):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다.")

    # 3. JWT 토큰 발급
    access_token = create_access_token(data={"sub": str(user.user_pk)})

    return {
        "message": "로그인에 성공했습니다.",
        "access_token": access_token,
        "token_type": "bearer"
    }
