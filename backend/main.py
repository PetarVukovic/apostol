from fastapi import FastAPI, Form, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models, schemas
from typing import List, Optional
import os

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

UPLOAD_DIRECTORY = "uploaded_files"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

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
            file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
            with open(file_location, "wb") as f:
                f.write(content)
            file_record = models.File(
                name=file.filename, path=file_location, agent_id=agent.id
            )
            db.add(file_record)
            db.commit()
    return agent

# Update an existing agent
@app.put("/api/agents/{agent_id}", response_model=schemas.Agent)
async def update_agent(
    agent_id: int,
    name: str = Form(...),
    prompt: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.name = name
    agent.prompt = prompt
    db.commit()

    if files:
        for file in files:
            content = await file.read()
            file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
            with open(file_location, "wb") as f:
                f.write(content)
            file_record = models.File(
                name=file.filename, path=file_location, agent_id=agent.id
            )
            db.add(file_record)
            db.commit()
    return agent

# Delete an agent
@app.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(agent)
    db.commit()
    return {"detail": "Agent deleted"}

# Delete a file
@app.delete("/api/files/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(file.path)
    db.delete(file)
    db.commit()
    return {"detail": "File deleted"}

# Get all agents
@app.get("/api/agents", response_model=List[schemas.Agent])
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(models.Agent).all()
    return agents

# Get conversation history
@app.get("/api/agents/{agent_id}/messages", response_model=List[schemas.Message])
def get_messages(agent_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(models.Message)
        .filter(models.Message.agent_id == agent_id)
        .all()
    )
    return messages

# Send a message to an agent
@app.post("/api/agents/{agent_id}/messages", response_model=schemas.Message)
def send_message(
    agent_id: int, message: schemas.MessageCreate, db: Session = Depends(get_db)
):
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

# Serve PDF files
@app.get("/api/files/{file_id}")
def get_file(file_id: int, db: Session = Depends(get_db)):
    file = db.query(models.File).filter(models.File.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file.path, media_type='application/pdf', filename=file.name)