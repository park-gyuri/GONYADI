from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from src.core.database import get_session
from src.schemas.save_schema import FolderCreate, FolderResponse, ItineraryCreate, ItineraryResponse
from src.crud import save_crud
from src.core.security import get_current_user
from src.models.user import Users

router = APIRouter()

def _attach_folder_names(itineraries, session, user_id) -> list[ItineraryResponse]:
    """Itineraries 리스트에 folder_name을 붙여서 ItineraryResponse로 변환"""
    folders = save_crud.get_folders_by_user(session=session, user_id=user_id)
    folder_map = {f.folder_pk: f.name for f in folders}

    result = []
    for itin in itineraries:
        data = itin.model_dump()
        data['folder_name'] = folder_map.get(itin.folder_id)
        result.append(ItineraryResponse(**data))
    return result


@router.post("/folders", response_model=FolderResponse)
def create_folder(folder_in: FolderCreate, session: Session = Depends(get_session), current_user: Users = Depends(get_current_user)):
    return save_crud.create_folder(session=session, folder_in=folder_in, user_id=current_user.user_pk)

@router.get("/folders", response_model=list[FolderResponse])
def get_folders(session: Session = Depends(get_session), current_user: Users = Depends(get_current_user)):
    return save_crud.get_folders_by_user(session=session, user_id=current_user.user_pk)

@router.put("/folders/{folder_id}", response_model=FolderResponse)
def update_folder(folder_id: int, folder_in: FolderCreate, session: Session = Depends(get_session), current_user: Users = Depends(get_current_user)):
    folder = save_crud.update_folder(session=session, folder_id=folder_id, new_name=folder_in.name, user_id=current_user.user_pk)
    if not folder:
        raise HTTPException(status_code=404, detail="폴더를 찾을 수 없거나 수정 권한이 없습니다.")
    return folder

@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: int, session: Session = Depends(get_session), current_user: Users = Depends(get_current_user)):
    success = save_crud.delete_folder(session=session, folder_id=folder_id, user_id=current_user.user_pk)
    if not success:
        raise HTTPException(status_code=404, detail="폴더를 찾을 수 없거나 삭제 권한이 없습니다.")
    return {"message": "폴더가 삭제되었습니다."}

@router.post("/itineraries", response_model=ItineraryResponse)
def save_itinerary(itinerary_in: ItineraryCreate, session: Session = Depends(get_session), current_user: Users = Depends(get_current_user)):
    itin = save_crud.create_itinerary(session=session, itinerary_in=itinerary_in, user_id=current_user.user_pk)
    return _attach_folder_names([itin], session, current_user.user_pk)[0]

@router.get("/folders/{folder_id}/itineraries", response_model=list[ItineraryResponse])
def get_itineraries(folder_id: int, session: Session = Depends(get_session), current_user: Users = Depends(get_current_user)):
    itins = save_crud.get_itineraries_by_folder(session=session, folder_id=folder_id, user_id=current_user.user_pk)
    return _attach_folder_names(itins, session, current_user.user_pk)

@router.get("/itineraries", response_model=list[ItineraryResponse])
def get_all_itineraries(session: Session = Depends(get_session), current_user: Users = Depends(get_current_user)):
    itins = save_crud.get_all_itineraries_by_user(session=session, user_id=current_user.user_pk)
    return _attach_folder_names(itins, session, current_user.user_pk)

@router.get("/itineraries/{itinerary_id}", response_model=ItineraryResponse)
def get_itinerary_detail(itinerary_id: int, session: Session = Depends(get_session), current_user: Users = Depends(get_current_user)):
    itin = save_crud.get_itinerary_by_id(session=session, itinerary_id=itinerary_id, user_id=current_user.user_pk)
    if not itin:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return _attach_folder_names([itin], session, current_user.user_pk)[0]
