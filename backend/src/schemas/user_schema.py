from sqlmodel import SQLModel

class UserCreate(SQLModel):
    usr_id: str        
    usr_password: str
    usr_nickname: str  
    usr_email: str  