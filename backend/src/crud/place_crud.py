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


# 여러 장소 처리를 위한 반복 함수
def get_or_create_places_bulk(places: list[PlaceResult], session: Session) -> list[Places]:
    return [get_or_create_place(p, session) for p in places]