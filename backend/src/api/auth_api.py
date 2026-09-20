from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session
import os
import shutil
from src.core.database import get_session
from src.schemas.user_schema import UserCreate, UserLogin, UserUpdate
from src.core.security import verify_password, create_access_token, create_refresh_token, verify_access_token, get_current_user
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
    # 0. 이미 가입된 이메일인지 확인
    existing_user = user_crud.get_user_by_email(email, session)
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")
    # 1. 이메일 형식 검증 (커스텀 메시지)
    try:
        # check_deliverability=True로 설정하면 실제 존재하는 도메인인지 체크합니다.
        validate_email(email, check_deliverability=False)
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
        # 실제 운영 환경(RESEND_API_KEY 설정 있음)에서 발송 실패한 경우
        from src.services.email_service import RESEND_API_KEY
        if RESEND_API_KEY:
             raise HTTPException(status_code=400, detail="존재하지 않는 이메일이거나 발송에 실패했습니다.")
        else:
            # 개발 환경(RESEND_API_KEY 설정 없음)에서는 터미널에 띄워주고 진행 허용
            print(f"DEBUG: [인증 코드: {code}] (RESEND_API_KEY 설정이 없어 터미널에 출력합니다)")

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
        raise HTTPException(status_code=401, detail="아이디가 존재하지 않습니다.")

    # 2. 비밀번호 확인
    if not verify_password(user_input.user_password, user.user_password):
        raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")

    # 3. JWT 토큰 발급 (Access & Refresh)
    access_token = create_access_token(data={"sub": str(user.user_pk)})
    refresh_token = create_refresh_token(data={"sub": str(user.user_pk)})

    return {
        "message": "로그인에 성공했습니다.",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh")
def refresh_token(refresh_token: str, session: Session = Depends(get_session)):
    """Refresh Token을 이용해 새로운 Access Token을 발급합니다."""
    # 1. Refresh Token 검증
    payload = verify_access_token(refresh_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="유효하지 않거나 만료된 갱신 토큰입니다.")
    
    user_pk = payload.get("sub")
    if not user_pk:
        raise HTTPException(status_code=401, detail="토큰 정보가 올바르지 않습니다.")
        
    # 2. 새로운 Access Token 발급
    new_access_token = create_access_token(data={"sub": user_pk})
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """현재 로그인한 유저의 정보를 반환합니다."""
    return {
        "user_id": current_user.user_id,
        "user_nickname": current_user.user_nickname,
        "user_email": current_user.user_email,
        "user_profile_image": current_user.user_profile_image
    }

@router.put("/me")
def update_me(
    user_update: UserUpdate, 
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """현재 로그인한 유저의 정보를 수정합니다."""
    update_data = user_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="수정할 정보가 없습니다.")
        
    updated_user = user_crud.update_user(current_user, update_data, session)
    return {
        "message": "프로필이 성공적으로 업데이트 되었습니다.",
        "user_nickname": updated_user.user_nickname,
        "user_profile_image": updated_user.user_profile_image
    }

@router.post("/me/profile-image")
def upload_profile_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    import time
    from src.core.supabase_client import upload_file_to_supabase
    
    """현재 로그인한 유저의 프로필 사진을 업로드합니다."""
    extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    
    # 새 파일명 생성 (타임스탬프 추가로 캐시 무효화)
    filename = f"user_{current_user.user_pk}_{int(time.time())}{extension}"
    
    try:
        # 파일을 읽어서 Supabase Storage에 업로드
        file_bytes = file.file.read()
        public_url = upload_file_to_supabase(file_bytes=file_bytes, file_name=filename, bucket_name="images")
    except Exception as e:
        print(f"[ERROR] Supabase 이미지 업로드 실패: {e}")
        raise HTTPException(status_code=500, detail=f"이미지 업로드에 실패했습니다: {str(e)}")
        
    current_user.user_profile_image = public_url
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return {
        "message": "프로필 이미지가 성공적으로 업로드 되었습니다.",
        "user_profile_image": public_url
    }

@router.delete("/me")
def withdraw(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """현재 로그인한 유저의 계정을 탈퇴(삭제)합니다."""
    # current_user는 dictionary이므로, 실제 Users 객체를 불러와야 할 수 있음.
    # get_current_user에서 반환하는 형태를 확인 후 적절히 객체를 조회
    user = user_crud.get_user_by_id(current_user.user_id, session)
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")
        
    user_crud.delete_user(user, session)
    return {"message": "계정이 성공적으로 탈퇴되었습니다."}