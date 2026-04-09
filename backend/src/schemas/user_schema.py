from sqlmodel import SQLModel, Field

class UserCreate(SQLModel):
    user_id: str        
    user_password: str = Field(max_length=72)  
    user_nickname: str  
    user_email: str  

class UserLogin(SQLModel):
    user_id:       str
    user_password: str = Field(max_length=72)  