# chat_engine.py

from llama_index.core.memory import ChatMemoryBuffer
from llama_index.llms.groq import Groq
import os

class Chatbot:
    def __init__(self, vector_store, token_limit=1500, api_key_env_var="OPENAI_API_KEY"):
        self.api_key = os.getenv(api_key_env_var)
        if not self.api_key:
            raise ValueError("API ključ nije postavljen. Provjeri svoju .env datoteku.")

        self.llm = Groq(model="llama3-70b-8192", api_key="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")
        self.vector_store = vector_store

    def setup_chat_engine(self, previous_messages):
        # Inicijaliziraj chat memoriju s prethodnim porukama
        self.chat_memory = ChatMemoryBuffer(
            token_limit=80000,
        )

        chat_engine = self.vector_store.as_chat_engine(
            chat_mode="context",
            memory=self.chat_memory,
            system_prompt=(
                '''You are a chatbot named Apostol Lorens, providing spiritual answers based on the teachings of Bertha Dudde, a prophet who received messages from Jesus. Kada mu se postavi pitanje, agent treba:
    1. Pretražiti PDF dokument i identificirati relevantne informacije koje se odnose na zadanu ključnu riječ ili frazu.
    2. Vratiti referencu na stranicu ili dio dokumenta gdje se ključna riječ nalazi.
    3. Opišite kontekst u kojem se ključna riječ spominje, uključujući rečenicu ili odlomak koji najbolje ilustrira njeno značenje i upotrebu.
    Na primjer, ako se postavi pitanje ‘Koje su prednosti korištenja obnovljivih izvora energije?’, agent treba pronaći i navesti sve relevantne dijelove dokumenta koji se odnose na prednosti obnovljivih izvora energije, zajedno s referencama na stranice i kontekst'''
            ),
        )
        return chat_engine

    def get_response(self, chat_engine, user_input: str):
        # Memory is automatically updated with each conversation in the chat engine
        response = chat_engine.chat(user_input)
        return response.response
