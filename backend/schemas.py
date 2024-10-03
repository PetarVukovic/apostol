# schemas.py
from pydantic import BaseModel
from typing import List

class File(BaseModel):
    id: int
    name: str
    path:str

    class Config:
        orm_mode = True

class MessageBase(BaseModel):
    sender: str
    text: str

class MessageCreate(BaseModel):
    text: str

class Message(MessageBase):
    id: int

    class Config:
        orm_mode = True

class Agent(BaseModel):
    id: int
    name: str
    prompt: str
    files: List[File] = []

    class Config:
        orm_mode = True