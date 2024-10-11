from fastapi import FastAPI, Depends,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dependencies import get_db
from supabase import Client
from schemas.users import UserLogin, UserOut, UserRegister
import bcrypt
from jose import jwt
from auth import compare_passwords


app = FastAPI()

# Postavljanje CORS-a
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=UserOut)
async def create_user(user: UserRegister, supabase: Client = Depends(get_db)):
    hashed_password=bcrypt.hashpw(user.password_hash.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    try:
        new_user = supabase.table('users').insert({
            'name': user.name,
            'email': user.email,
            'password_hash': hashed_password
        }).execute()

    except HTTPException as e:
        return e.status_code
    
@app.post("/login")
async def login(user: UserLogin, supabase: Client = Depends(get_db)):
    try:
        users=supabase.table('users').select('*').eq('email',user.email).execute()
        if users.data:
            if compare_passwords(user.password, users.data[0]['password_hash']):
                access_token = jwt.encode({'user_id': users.data[0]['user_id']}, 'secret', algorithm='HS256')
                return {'access_token': access_token}
    except HTTPException as e:
        return e.status_code

@app.get("/get-users",response_model=list[UserOut])
async def get_users(supabase: Client = Depends(get_db)):
    try:
        users = supabase.table('users').select('*').execute()
        return users.data
    except HTTPException as e:
        return e.status_code






