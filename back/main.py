# main.py

from typing import Optional
from fastapi import FastAPI, Depends, Form, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from dependencies import get_db
from supabase import Client
from schemas.agents import AgentOut
from schemas.users import UserLogin, UserOut, UserRegister
from auth import compare_passwords, get_current_userId, oauth2_scheme, SECRET_KEY, ALGORITHM
import bcrypt
from jose import jwt
import os

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/register", response_model=UserOut)
async def create_user(user: UserRegister, supabase: Client = Depends(get_db)):
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    try:
        new_user = supabase.table('users').insert({
            'name': user.name,
            'email': user.email,
            'password_hash': hashed_password
        }).execute()
        return UserOut.model_validate(new_user.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
async def login(user: UserLogin, supabase: Client = Depends(get_db)):
    try:
        users = supabase.table('users').select('*').eq('email', user.email).execute()
        if users.data:
            if compare_passwords(user.password, users.data[0]['password_hash']):
                access_token = jwt.encode({'user_id': users.data[0]['user_id']}, SECRET_KEY, algorithm=ALGORITHM)
                return {'access_token': access_token}
            else:
                raise HTTPException(status_code=400, detail="Incorrect username or password")
        else:
            raise HTTPException(status_code=400, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/create-agent', response_model=AgentOut)
async def create_agent(
    name: str = Form(...),
    prompt: str = Form(...),
    file: Optional[UploadFile] = File(None),
    user_id: str = Depends(get_current_userId),
    supabase: Client = Depends(get_db)
):
    try:
        filename = None
        if file:
            # Kreiraj direktorij ako ne postoji
            save_dir = os.path.join(os.path.dirname(__file__), 'files')
            os.makedirs(save_dir, exist_ok=True)
            # Definiraj putanju za spremanje datoteke
            file_path = os.path.join(save_dir, file.filename)

            # Spremi PDF datoteku
            with open(file_path, 'wb') as f:
                content = await file.read()  # Pročitaj datoteku kao byteove
                f.write(content)  # Zapiši sadržaj u novu datoteku

        # Kreiraj novi unos agenta u bazi podataka
        new_agent = supabase.table('agents').insert({
            'name': name,
            'prompt': prompt,
            'user_id': user_id,
            'files': file.filename,
            'chatHistory': ''  # Inicijaliziraj chatHistory kao prazan string
        }).execute()
        
        # Dohvati unesene podatke o agentu
        agent_data = new_agent.data[0]
        return AgentOut.model_validate(agent_data)
    
    except Exception as e:
        # Ispisuje grešku kako bi lakše dijagnosticirao problem
        print(f"Greška: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get('/get-agents', response_model=list[AgentOut])
async def get_agents(user_id: str = Depends(get_current_userId), supabase: Client = Depends(get_db)):
    try:
        agents = supabase.table('agents').select('*').eq('user_id', user_id).execute()
        return [AgentOut.model_validate(agent) for agent in agents.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))