from sqlmodel import SQLModel, Field
from pydantic import EmailStr

class UserCreate(SQLModel):
    user_id: str        
    user_password: str = Field(max_length=72)  
    user_nickname: str  
    user_email: EmailStr  

class UserLogin(SQLModel):
    user_id:       str
    user_password: str = Field(max_length=72)  