from pymongo import MongoClient
from app.config import MONGODB_URI, DATABASE_NAME

_client = None

def get_database():
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client[DATABASE_NAME]

def close_mongo_connection():
    global _client
    if _client is not None:
        _client.close()
        _client = None
