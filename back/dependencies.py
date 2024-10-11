from fastapi import Depends
from supabase import Client
from database import create_async_client

async def get_db() -> Client:
    """
    Inicijalizira i vraća asinkroni Supabase klijent.
    """
    return create_async_client()