# git
''' 최초 1회 연동 (내 컴퓨터의 c에 GONYADI가 존재하는 경우)'''
```bash
cd c/GONYADI 
git clone https://github.com/park-gyuri/GONYADI.git .


''' 작업 전 '''
git checkout main
git pull origin main # 최신 main 코드 가져오기


''' 코드 작성 (branch에서 작업) '''
git checkout -b 작업자성/기능 (이미 생성한 브랜치로 이동할 때는 -b 빼기)
# ex Hong/user-profile


''' 작업 후 저장 '''
git status
git add .
git commit -m "아래 규칙에 따라 커밋 메시지 작성"
# 태그: 설명
# Feat: 새로운 기능을 만들었을 때 사용 (ex Feat: 구글 로그인 기능 구현)
# Fix: 버그나 오류를 고쳤을 때 사용 (ex Fix: 게시판 댓글이 안 써지는 오류 수정)
# Docs: 문서를 수정했을 때 사용 (ex Docs: 설치 방법 및 실행 가이드 업데이트)
# Style: 코드의 의미는 변하지 않고, **포맷팅(들여쓰기, 세미콜론 누락 등)**만 고쳤을 때 사용 (ex Style: 전체적인 코드 들여쓰기 정렬)
# Refactor: 기능을 추가하거나 버그를 잡은 건 아니지만, 코드를 더 깨끗하게 정리했을 때 사용 (ex Refactor: 중복되는 API 호출 함수 하나로 통합)


''' 깃 허브에 올리기 '''
git push origin 브랜치명
# github 저장소로 이동하여 Comapare & pull request
# 상의 후 merge