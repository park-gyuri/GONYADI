from sqlmodel import Session, select
from src.models.folder import Folders
from src.models.itinerary import Itineraries
from src.schemas.save_schema import FolderCreate, ItineraryCreate

def create_folder(session: Session, folder_in: FolderCreate, user_id: int) -> Folders:
    db_folder = Folders(name=folder_in.name, user_id=user_id)
    session.add(db_folder)
    session.commit()
    session.refresh(db_folder)
    return db_folder

def get_folders_by_user(session: Session, user_id: int) -> list[Folders]:
    statement = select(Folders).where(Folders.user_id == user_id).order_by(Folders.created_at.desc())
    results = session.exec(statement).all()
    
    # 기본 폴더 생성 로직
    if not results:
        default_folders = ["국내", "해외"]
        for folder_name in default_folders:
            db_folder = Folders(name=folder_name, user_id=user_id)
            session.add(db_folder)
        session.commit()
        
        # 다시 조회해서 반환
        results = session.exec(statement).all()
        
    return results

def create_itinerary(session: Session, itinerary_in: ItineraryCreate, user_id: int) -> Itineraries:
    db_itinerary = Itineraries(
        folder_id=itinerary_in.folder_id,
        user_id=user_id,
        title=itinerary_in.title,
        region=itinerary_in.region,
        start_date=itinerary_in.start_date,
        end_date=itinerary_in.end_date,
        nights=itinerary_in.nights,
        days=itinerary_in.days,
        number_of_people=itinerary_in.number_of_people,
        budget_per_person=itinerary_in.budget_per_person,
        recommendation_data=itinerary_in.recommendation_data
    )
    session.add(db_itinerary)
    session.commit()
    session.refresh(db_itinerary)
    return db_itinerary

def get_itineraries_by_folder(session: Session, folder_id: int, user_id: int) -> list[Itineraries]:
    statement = select(Itineraries).where(
        Itineraries.folder_id == folder_id,
        Itineraries.user_id == user_id
    ).order_by(Itineraries.created_at.desc())
    return session.exec(statement).all()

def get_all_itineraries_by_user(session: Session, user_id: int) -> list[Itineraries]:
    statement = select(Itineraries).where(
        Itineraries.user_id == user_id
    ).order_by(Itineraries.created_at.desc())
    return session.exec(statement).all()
