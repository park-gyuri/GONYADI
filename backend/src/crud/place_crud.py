from sqlmodel import Session, select
from src.models.place import Places
from src.schemas.recommend_schema import PlaceResult
from src.services.google_places import enrich_place_from_google


# 장소 1개를 받아 DB에 저장하거나 기존 장소를 반환하는 함수
def get_or_create_place(place_data: PlaceResult, session: Session) -> Places:
    # 1. Google Places로 보정 데이터 먼저 가져오기
    google_data = enrich_place_from_google(
        name=place_data.name,
        lat=place_data.lat,
        lng=place_data.lng,
    )
    google_place_id = google_data.get("google_place_id") if google_data else None

    # 2. google_place_id로 중복 체크 (있을 때만)
    if google_place_id:
        existing = session.exec(
            select(Places).where(Places.google_place_id == google_place_id)
        ).first()
        if existing:
            print(f"[CRUD] 기존 장소 재사용: {existing.name}")
            return existing

    # 3. 없으면 신규 생성
    new_place = Places(
        # Gemini가 채워주는 필드
        name=place_data.name,
        lat=place_data.lat,
        lng=place_data.lng,
        category=place_data.category,
        # Google Places가 채워주는 필드
        google_place_id=google_place_id,
        address=google_data.get("address") if google_data else None,
        rating=google_data.get("rating") if google_data else None,
        opening_hours=google_data.get("opening_hours") if google_data else None,
    )
    session.add(new_place)
    session.commit()
    session.refresh(new_place)
    print(f"[DB] 장소 저장 완료: {new_place.name}")
    return new_place


# 여러 장소 처리를 위한 반복 함수 (파이썬 단에서 중복 제거 추가)
def get_or_create_places_bulk(places: list[PlaceResult], session: Session) -> list[Places]:
    processed_places = []
    seen_google_ids = set()
    
    for place_data in places:
        # 1. 보정 데이터 가져오기
        google_data = enrich_place_from_google(
            name=place_data.name,
            lat=place_data.lat,
            lng=place_data.lng,
        )
        google_place_id = google_data.get("google_place_id") if google_data else None
        
        # 2. 이번 요청(리스트) 내에서 중복되는 장소인지 확인 (파이썬 단 중복 방지)
        if google_place_id:
            if google_place_id in seen_google_ids:
                print(f"[CRUD] 벌크 요청 내 중복 장소 건너뜀: {place_data.name}")
                # 이미 저장된 객체 중에서 찾아서 반환 배열에 넣기
                existing_in_current = next((p for p in processed_places if p.google_place_id == google_place_id), None)
                if existing_in_current:
                    processed_places.append(existing_in_current)
                continue
            
            seen_google_ids.add(google_place_id)
            
            # 3. DB에 기존 장소가 있는지 확인
            existing = session.exec(
                select(Places).where(Places.google_place_id == google_place_id)
            ).first()
            if existing:
                print(f"[CRUD] 기존 장소 재사용: {existing.name}")
                processed_places.append(existing)
                continue

        # 4. 신규 생성 및 DB 추가 대기(flush)
        new_place = Places(
            name=place_data.name,
            lat=place_data.lat,
            lng=place_data.lng,
            category=place_data.category,
            google_place_id=google_place_id,
            address=google_data.get("address") if google_data else None,
            rating=google_data.get("rating") if google_data else None,
            opening_hours=google_data.get("opening_hours") if google_data else None,
        )
        session.add(new_place)
        session.flush() # 일괄 처리를 위해 commit 대신 flush 사용
        print(f"[DB] 장소 생성 대기: {new_place.name}")
        processed_places.append(new_place)
        
    # 모든 장소 처리 후 한 번에 commit
    session.commit()
    
    # 반환하기 전 새로 생성된 객체들의 ID 등 갱신
    for p in processed_places:
        session.refresh(p)
        
    return processed_places