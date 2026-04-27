from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.save_schema import FolderCreate, FolderResponse, ItineraryCreate, ItineraryResponse
from src.crud import save_crud

router = APIRouter()

# 임시 유저 ID (실제 인증이 적용되면 Depends(get_current_user) 등으로 대체)
TEMP_USER_ID = 1

@router.post("/folders", response_model=FolderResponse)
def create_folder(folder_in: FolderCreate, session: Session = Depends(get_session)):
    return save_crud.create_folder(session=session, folder_in=folder_in, user_id=TEMP_USER_ID)

@router.get("/folders", response_model=list[FolderResponse])
def get_folders(session: Session = Depends(get_session)):
    return save_crud.get_folders_by_user(session=session, user_id=TEMP_USER_ID)

@router.post("/itineraries", response_model=ItineraryResponse)
def save_itinerary(itinerary_in: ItineraryCreate, session: Session = Depends(get_session)):
    return save_crud.create_itinerary(session=session, itinerary_in=itinerary_in, user_id=TEMP_USER_ID)

@router.get("/folders/{folder_id}/itineraries", response_model=list[ItineraryResponse])
def get_itineraries(folder_id: int, session: Session = Depends(get_session)):
    return save_crud.get_itineraries_by_folder(session=session, folder_id=folder_id, user_id=TEMP_USER_ID)

@router.get("/itineraries", response_model=list[ItineraryResponse])
def get_all_itineraries(session: Session = Depends(get_session)):
    return save_crud.get_all_itineraries_by_user(session=session, user_id=TEMP_USER_ID)
