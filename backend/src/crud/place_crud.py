from sqlmodel import Session, select, text
from src.models.place import Places
from src.schemas.recommend_schema import PlaceResult, PlaceCandidate
from src.services.google_places import enrich_place_from_google
from typing import Optional


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


# ── [RAG] Step 1: Haversine SQL로 반경 내 후보 조회 ────────────────────────────────
def retrieve_candidates_by_location(
    lat: float,
    lng: float,
    radius_km: float,
    categories: Optional[list[str]],
    session: Session,
    limit: int = 30,
) -> list[PlaceCandidate]:
    """
    중심 좌표(lat, lng) 기준 반경 radius_km 이내의 DB 장소를 조회한다.
    PostGIS 없이 순수 SQL Haversine 공식 사용.
    categories가 비어 있으면 카테고리 필터 미적용.
    """
    # 카테고리 필터 조건 (없으면 전체)
    if categories:
        # SQLite 호환을 위해 Python-side 필터를 섞지 않고 IN 절 사용
        category_placeholders = ", ".join([f":cat{i}" for i in range(len(categories))])
        cat_filter = f"AND category IN ({category_placeholders})"
        cat_params = {f"cat{i}": c for i, c in enumerate(categories)}
    else:
        cat_filter = ""
        cat_params = {}

    sql = text(f"""
        SELECT
            place_pk,
            name,
            lat,
            lng,
            category,
            (
                6371 * acos(
                    LEAST(1.0, 
                        cos(radians(:center_lat)) * cos(radians(lat))
                        * cos(radians(lng) - radians(:center_lng))
                        + sin(radians(:center_lat)) * sin(radians(lat))
                    )
                )
            ) AS distance_km
        FROM places
        WHERE
            (
                6371 * acos(
                    LEAST(1.0,
                        cos(radians(:center_lat)) * cos(radians(lat))
                        * cos(radians(lng) - radians(:center_lng))
                        + sin(radians(:center_lat)) * sin(radians(lat))
                    )
                )
            ) <= :radius_km
            {cat_filter}
        ORDER BY distance_km
        LIMIT :lim
    """)

    params = {
        "center_lat": lat,
        "center_lng": lng,
        "radius_km": radius_km,
        "lim": limit,
        **cat_params,
    }

    rows = session.exec(sql, params=params).all()  # type: ignore
    result = [
        PlaceCandidate(
            place_pk=row.place_pk,
            name=row.name,
            lat=row.lat,
            lng=row.lng,
            category=row.category,
            distance_km=round(row.distance_km, 3),
        )
        for row in rows
    ]
    print(f"[RAG DB] 반경 {radius_km}km 이내 후보 {len(result)}개 조회")
    return result


# ── [RAG] Fallback 결과를 DB에 캐싱 ────────────────────────────────────────────
def bulk_upsert_places(places_data: list[dict], session: Session) -> list[Places]:
    """
    Google Places API Fallback 결과를 DB에 저장/갱신.
    places_data: [{'name', 'lat', 'lng', 'category', 'google_place_id', 'address', 'rating'}]
    google_place_id가 있으면 이를 기준으로 중복 확인 (name 기준 fallback).
    """
    saved = []
    for data in places_data:
        gid = data.get("google_place_id")
        existing = None

        # 1. google_place_id로 중복 확인
        if gid:
            existing = session.exec(
                select(Places).where(Places.google_place_id == gid)
            ).first()

        # 2. name으로 중복 확인 (google_place_id 없을 때)
        if not existing:
            existing = session.exec(
                select(Places).where(Places.name == data["name"])
            ).first()

        if existing:
            # 기존 데이터 업데이트 (좌표·주소만 갱신)
            if gid and not existing.google_place_id:
                existing.google_place_id = gid
            if data.get("address") and not existing.address:
                existing.address = data["address"]
            session.add(existing)
            saved.append(existing)
        else:
            # 신규 생성
            new_place = Places(
                name=data["name"],
                lat=data["lat"],
                lng=data["lng"],
                category=data.get("category", "기타"),
                google_place_id=gid,
                address=data.get("address"),
                rating=data.get("rating"),
            )
            session.add(new_place)
            session.flush()
            print(f"[RAG Cache] 신규 장소 캐싱: {new_place.name}")
            saved.append(new_place)

    session.commit()
    for p in saved:
        session.refresh(p)
    print(f"[RAG Cache] 총 {len(saved)}개 장소 DB 캐싱 완료")
    return saved