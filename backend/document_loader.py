from llama_parse import LlamaParse

class DocumentLoader:
    def __init__(self, api_key, result_type="markdown"):
        self.api_key = api_key
        self.result_type = result_type

    def load_documents(self, document_paths):
        parser = LlamaParse(api_key=self.api_key, result_type=self.result_type)
        documents =  parser.load_data(document_paths)
        return documents