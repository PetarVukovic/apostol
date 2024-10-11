from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Učitaj .env varijable
load_dotenv()

# Funkcija za kreiranje Supabase klijenta
def create_async_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    print(supabase_url, supabase_key)
    
    return create_client(supabase_url, supabase_key)