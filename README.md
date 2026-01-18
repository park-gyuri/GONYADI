<<<<<<< HEAD
# GONYADI
=======
# 각자의 폴더(backend, frontend)에서 실행

# git
''' 최초 1회 연동 '''
```bash
   git clone https://github.com/park-gyuri/GONYADI.git 
   cd GONYADI 


''' 작업 전 '''
git checkout main
git pull origin main # 최신 코드 가져오기


''' 새로운 기능 작업할 때 '''
git checkout -b 이거 이제 정해야 함 (이미 생성한 브랜치로 이동할 때는 -b 빼기)
ex) feature/기능 // 작업자이름/기능 // 기능-작업자이름 등


''' 작업 후 저장 '''
git add .
git commit -m "커밋 메시지 규칙도 이제 정해야 함"


''' 깃 허브에 올리기 '''
git push origin 위에서 정한 이름
#github 저장소로 이동하여 Comapare & pull request
#상의 후 merge

>>>>>>> 0ba1922 (프로젝트 기본 구조)
