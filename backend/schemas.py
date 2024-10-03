# schemas.py

from pydantic import BaseModel
from typing import List, Optional

class FileBase(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class MessageBase(BaseModel):
    id: int
    sender: str
    text: str

    class Config:
        orm_mode = True

class AgentCreate(BaseModel):
    name: str
    prompt: str

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    prompt: Optional[str] = None

class Agent(BaseModel):
    id: int
    name: str
    prompt: str
    files: List[FileBase] = []
    chatHistory: List[MessageBase] = []

    class Config:
        orm_mode = True

class MessageCreate(BaseModel):
    text: str