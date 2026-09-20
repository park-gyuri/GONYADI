import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Render 무료 플랜이 아웃바운드 SMTP(25/465/587)를 차단하면서
# smtplib 기반 발송이 더 이상 동작하지 않아, Resend HTTPS API로 교체했습니다.
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
# 자체 도메인을 Resend에 인증하기 전까지는 onboarding@resend.dev만 발신자로 쓸 수 있고,
# 이 경우 Resend 계정 본인 이메일로만 발송됩니다. 도메인 인증 후에는 그 도메인의 주소로 교체하세요.
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

RESEND_API_URL = "https://api.resend.com/emails"


def send_verification_email(to_email: str, code: str) -> bool:
    """Resend API로 인증 이메일을 발송하는 함수"""
    if not RESEND_API_KEY:
        print(f"[WARNING] RESEND_API_KEY 설정이 없습니다. [인증 코드: {code}] 이메일 발송을 건너뜁니다.")
        return False

    body_html = f"""
    <p>안녕하세요, GONYADI입니다.</p>
    <p>회원가입을 위해 아래 인증 번호를 입력해 주세요.</p>
    <h2>인증 번호: {code}</h2>
    <p>이 번호는 5분 동안 유효합니다.</p>
    """

    payload = {
        "from": RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": "[GONYADI] 이메일 인증 번호입니다.",
        "html": body_html,
    }
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(RESEND_API_URL, json=payload, headers=headers, timeout=10)
        if response.status_code >= 400:
            print(f"[ERROR] 이메일 발송 실패 ({response.status_code}): {response.text}")
            return False
        return True
    except requests.RequestException as e:
        print(f"[ERROR] 이메일 발송 실패: {e}")
        return False