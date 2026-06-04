import os
from datetime import datetime, timezone
from typing import Optional

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

_client: MongoClient | None = None
_database: Database | None = None


def get_mongo_client() -> MongoClient | None:
    global _client, _database

    if _client is not None:
        return _client

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        return None

    _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db_name = os.getenv("MONGO_DB_NAME", "snapsave")
    _database = _client[db_name]
    return _client


def get_db() -> Database | None:
    if get_mongo_client() is None:
        return None
    return _database


def get_collection(name: str) -> Collection | None:
    database = get_db()
    if database is None:
        return None
    return database[name]


def ensure_indexes() -> None:
    users = get_collection("users")
    downloads = get_collection("downloads")
    transactions = get_collection("transactions")

    if users is not None:
        users.create_index("email", unique=True)
        users.create_index("username", unique=True, sparse=True)

    if downloads is not None:
        downloads.create_index([("user_id", 1), ("created_at", -1)])

    if transactions is not None:
        transactions.create_index([("user_id", 1), ("created_at", -1)])


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
