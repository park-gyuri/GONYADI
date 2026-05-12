import urllib.request
import urllib.error

req = urllib.request.Request('http://localhost:8000/api/v1/auth/send-verification?email=test@gmail.com', method='POST')
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Status:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Other error:", e)
