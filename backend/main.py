# main.py

from fastapi import FastAPI, Form, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from chat_engine import Chatbot
from document_loader import DocumentLoader
from vdb import VectorStore
from database import SessionLocal, engine, Base
import models, schemas
from typing import List, Optional
import os
from dotenv import load_dotenv
import nest_asyncio

Base.metadata.create_all(bind=engine)

app = FastAPI()
load_dotenv()
nest_asyncio.apply()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Zamijenite "*" s URL-om vašeg frontenda u produkciji
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

            # Obradi PDF i pohrani u Qdrant
            llamaparse_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
            document_loader = DocumentLoader(api_key=llamaparse_api_key, result_type="markdown")
            documents = document_loader.load_documents([file_location])

            vector_store = VectorStore(collection_name=f"agent_{agent.id}")
            vector_store.index_from_documents(documents)
            # Nema potrebe za kreiranjem Chatbot instance ovdje

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

            # Obradi PDF i pohrani u Qdrant
            llamaparse_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
            document_loader = DocumentLoader(api_key=llamaparse_api_key, result_type="markdown")
            documents = document_loader.load_documents([file_location])

            vector_store = VectorStore(collection_name=f"agent_{agent.id}")
            vector_store.index_from_documents(documents)
            # Nema potrebe za kreiranjem Chatbot instance ovdje

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
@app.get("/api/agents/{agent_id}/messages", response_model=List[schemas.MessageBase])
def get_messages(agent_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(models.Message)
        .filter(models.Message.agent_id == agent_id)
        .order_by(models.Message.id)
        .all()
    )
    return messages

# Send a message to an agent
@app.post("/api/agents/{agent_id}/messages", response_model=schemas.MessageBase)
async def send_message(
    agent_id: int,
    message: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Spremi korisničku poruku
    user_message = models.Message(
        sender='user', text=message.text, agent_id=agent_id
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # Dohvati prethodne poruke
    previous_messages = (
        db.query(models.Message)
        .filter(models.Message.agent_id == agent_id)
        .order_by(models.Message.id)
        .all()
    )
        # Dohvati datoteke povezane s agentom
    files = db.query(models.File).filter(models.File.agent_id == agent_id).all()
    if not files:
        raise HTTPException(status_code=404, detail="No files found for this agent")

    # Pripremi popis putanja do datoteka
    file_paths = [file.path for file in files]

    # Inicijaliziraj DocumentLoader i učitaj dokumente
    llamaparse_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
    document_loader = DocumentLoader(api_key=llamaparse_api_key, result_type="markdown")
    documents = document_loader.load_documents(file_paths)

    # Postavi chatbota s odgovarajućom kolekcijom iz Qdranta i prethodnim porukama
    vector_store = VectorStore(collection_name=f"agent_{agent_id}")
    index=vector_store.index_from_documents(documents=documents)
    chatbot = Chatbot(vector_store=index)
    chat_engine = chatbot.setup_chat_engine(previous_messages)

    # Generiraj odgovor
    bot_response_text = chatbot.get_response(chat_engine, message.text)

    # Spremi botov odgovor
    bot_message = models.Message(
        sender='bot', text=bot_response_text, agent_id=agent_id
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
