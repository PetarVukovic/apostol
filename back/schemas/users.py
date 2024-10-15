from pydantic import BaseModel,EmailStr
from typing import Optional
import time

class userBase(BaseModel):
    name: str
    email: EmailStr  # Bolje koristiti EmailStr za validaciju emaila

    class Config:
        from_attributes = True

class UserRegister(userBase):
    password: str
class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(userBase):
    user_id: int
    class Config:
        orm_mode = True

class userUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = NotImplemented