from sqlmodel import Session, select
from src.models.place import Places
from src.schemas.recommend_schema import PlaceResult


def get_or_create_place(place_data: PlaceResult, session: Session) -> Places:
    # 1. 기존 장소 조회
    statement = select(Places).where(Places.name == place_data.name)
    existing = session.exec(statement).first()

    if existing:
        return existing

    # 2. 없으면 신규 생성
    new_place = Places(
        name=place_data.name,
        lat=place_data.lat,
        lng=place_data.lng,
        category=place_data.category,
    )
    session.add(new_place)
    session.commit()
    session.refresh(new_place)

    return new_place


# 여러 장소 처리를 위한 반복 함수
def get_or_create_places_bulk(places: list[PlaceResult], session: Session) -> list[Places]:
    return [get_or_create_place(p, session) for p in places]