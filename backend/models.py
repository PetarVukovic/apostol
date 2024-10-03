# models.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Agent(Base):
    __tablename__ = 'agents'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    prompt = Column(String)
    files = relationship("File", back_populates="agent", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="agent", cascade="all, delete-orphan")

class File(Base):
    __tablename__ = 'files'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    path = Column(String)
    agent_id = Column(Integer, ForeignKey('agents.id'))
    agent = relationship("Agent", back_populates="files")

class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String)
    text = Column(String)
    agent_id = Column(Integer, ForeignKey('agents.id'))
    agent = relationship("Agent", back_populates="messages")