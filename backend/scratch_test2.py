from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)
try:
    response = client.post("/api/v1/auth/send-verification?email=test@gmail.com")
    print(response.status_code)
    print(response.json())
except Exception as e:
    import traceback
    traceback.print_exc()
