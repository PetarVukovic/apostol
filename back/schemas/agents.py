from typing import Optional
from pydantic import BaseModel

class AgentBase(BaseModel):
    agent_id: int
    name: str
    prompt: str
    chatHistory: Optional[str] = None  # Make chatHistory optional

class AgentCreate(BaseModel):
    name: str
    prompt: str
    files: Optional[str] = None  # Make files optional if not always provided
    user_id: int

class AgentOut(AgentBase):
    user_id: int