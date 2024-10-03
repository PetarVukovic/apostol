import os
from qdrant_client import QdrantClient
from llama_index.legacy.vector_stores import QdrantVectorStore
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.llms.groq import Groq

class VectorStore:
    def __init__(self, collection_name='Apostol', qdrant_api_key=None, qadrant_url=None):
        self.qdrant_api_key = qdrant_api_key or os.getenv("QDRANT_API_KEY")
        self.qadrant_url = qadrant_url or os.getenv('QDRANT_URL')
        self.collection_name = collection_name
        self.api_key = os.getenv("OPENAI_API_KEY")
        #self.llm = OpenAI(api_key=self.api_key, model="gpt-4o-mini")
        self.llm = Groq(model="llama3-70b-8192", api_key="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")

        # Inicijalizacija klijenta i vektorskog skladišta
        self.client = QdrantClient(
            api_key=self.qdrant_api_key,
            url=self.qadrant_url
        )
        self.vector_store = QdrantVectorStore(
            client=self.client, collection_name=self.collection_name
        )
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)

        # Postavljanje indeksa
        self.index = VectorStoreIndex.from_vector_store(
            self.vector_store, service_context=self.llm
        )

    def customize(self, collection_name=None, qdrant_api_key=None, qadrant_url=None):
        """Metoda za prilagodbu ključnih parametara kao što su naziv kolekcije, API ključ i URL"""
        if collection_name:
            self.collection_name = collection_name
        if qdrant_api_key:
            self.qdrant_api_key = qdrant_api_key
        if qadrant_url:
            self.qadrant_url = qadrant_url

        # Ponovna inicijalizacija klijenta i vektorskog skladišta
        self.client = QdrantClient(
            api_key=self.qdrant_api_key,
            url=self.qadrant_url
        )
        self.vector_store = QdrantVectorStore(
            client=self.client, collection_name=self.collection_name
        )
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)

        # Ponovno postavljanje indeksa
        self.index = VectorStoreIndex.from_vector_store(
            self.vector_store, service_context=self.llm
        )
        print(f"Vector store customized with collection name: {self.collection_name}")

    def index_from_documents(self, documents):
        """Metoda za kreiranje indeksa iz dokumenata"""
        return self.index.from_documents(documents)