# main.py
from fastapi import FastAPI, Form, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models, schemas
from typing import List, Optional

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create a new agent
@app.post("/api/agents", response_model=schemas.Agent)
async def create_agent(
    name: str = Form(...),
    prompt: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
):
    agent = models.Agent(name=name, prompt=prompt)
    db.add(agent)
    db.commit()
    db.refresh(agent)

    if files:
        for file in files:
            content = await file.read()
            # Save file content to disk or process as needed
            file_record = models.File(name=file.filename, agent_id=agent.id)
            db.add(file_record)
            db.commit()
    return agent


# Get all agents
@app.get("/api/agents", response_model=List[schemas.Agent])
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(models.Agent).all()
    return agents

# Get conversation history
@app.get("/api/agents/{agent_id}/messages", response_model=List[schemas.Message])
def get_messages(agent_id: int, db: Session = Depends(get_db)):
    messages = db.query(models.Message).filter(models.Message.agent_id == agent_id).all()
    return messages

# Send a message to an agent
@app.post("/api/agents/{agent_id}/messages", response_model=schemas.Message)
def send_message(agent_id: int, message: schemas.MessageCreate, db: Session = Depends(get_db)):
    # Save user message
    user_message = models.Message(
        sender='user', text=message.text, agent_id=agent_id
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Generate dummy bot response
    bot_response = f"Echo: {message.text}"
    bot_message = models.Message(
        sender='bot', text=bot_response, agent_id=agent_id
    )
    db.add(bot_message)
    db.commit()
    db.refresh(bot_message)

    return bot_message