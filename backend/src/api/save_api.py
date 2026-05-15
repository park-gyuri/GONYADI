from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.save_schema import FolderCreate, FolderResponse, ItineraryCreate, ItineraryResponse
from src.crud import save_crud

router = APIRouter()

TEMP_USER_ID = 1


def _attach_folder_names(itineraries, session) -> list[ItineraryResponse]:
    """Itineraries 리스트에 folder_name을 붙여서 ItineraryResponse로 변환"""
    folders = save_crud.get_folders_by_user(session=session, user_id=TEMP_USER_ID)
    folder_map = {f.folder_pk: f.name for f in folders}

    result = []
    for itin in itineraries:
        data = itin.model_dump()
        data['folder_name'] = folder_map.get(itin.folder_id)
        result.append(ItineraryResponse(**data))
    return result


@router.post("/folders", response_model=FolderResponse)
def create_folder(folder_in: FolderCreate, session: Session = Depends(get_session)):
    return save_crud.create_folder(session=session, folder_in=folder_in, user_id=TEMP_USER_ID)

@router.get("/folders", response_model=list[FolderResponse])
def get_folders(session: Session = Depends(get_session)):
    return save_crud.get_folders_by_user(session=session, user_id=TEMP_USER_ID)

@router.post("/itineraries", response_model=ItineraryResponse)
def save_itinerary(itinerary_in: ItineraryCreate, session: Session = Depends(get_session)):
    itin = save_crud.create_itinerary(session=session, itinerary_in=itinerary_in, user_id=TEMP_USER_ID)
    return _attach_folder_names([itin], session)[0]

@router.get("/folders/{folder_id}/itineraries", response_model=list[ItineraryResponse])
def get_itineraries(folder_id: int, session: Session = Depends(get_session)):
    itins = save_crud.get_itineraries_by_folder(session=session, folder_id=folder_id, user_id=TEMP_USER_ID)
    return _attach_folder_names(itins, session)

@router.get("/itineraries", response_model=list[ItineraryResponse])
def get_all_itineraries(session: Session = Depends(get_session)):
    itins = save_crud.get_all_itineraries_by_user(session=session, user_id=TEMP_USER_ID)
    return _attach_folder_names(itins, session)

@router.get("/itineraries/{itinerary_id}", response_model=ItineraryResponse)
def get_itinerary_detail(itinerary_id: int, session: Session = Depends(get_session)):
    itin = save_crud.get_itinerary_by_id(session=session, itinerary_id=itinerary_id, user_id=TEMP_USER_ID)
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return _attach_folder_names([itin], session)[0]
