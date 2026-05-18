import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_verification_email(to_email: str, code: str):
    """실제 이메일을 발송하는 함수"""
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[WARNING] SMTP 설정이 없습니다. [인증 코드: {code}] 이메일 발송을 건너뜁니다.")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = "[GONYADI] 이메일 인증 번호입니다."

        body = f"""
        안녕하세요, GONYADI입니다.
        회원가입을 위해 아래 인증 번호를 입력해 주세요.

        인증 번호: {code}

        이 번호는 5분 동안 유효합니다.
        """
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"[ERROR] 이메일 발송 실패: {e}")
        return False
