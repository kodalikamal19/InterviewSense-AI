import pytest
import os
import mongomock
from fastapi.testclient import TestClient

# Mock the connection attributes before importing the FastAPI application
import app.database.connection

# Create an in-memory mock MongoDB client and database
mock_client = mongomock.MongoClient()
mock_db = mock_client["test_interviewsense"]

# Override the database instances on the connection module
app.database.connection.db = mock_db

def mock_get_next_sequence_value(sequence_name: str) -> int:
    """
    Mock sequence generator for sequential integer IDs in unit tests.
    """
    counter = mock_db["counters"].find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return counter["seq"]

app.database.connection.get_next_sequence_value = mock_get_next_sequence_value

from app.main import app
from app.database.connection import get_db

@pytest.fixture(autouse=True)
def clean_db():
    """
    Cleans all collections in the mock database before each test runs.
    """
    for col in mock_db.list_collection_names():
        mock_db[col].delete_many({})
    yield

@pytest.fixture
def db():
    """
    Yields the mock database context.
    """
    yield mock_db

@pytest.fixture
def client(db):
    """
    Provides a FastAPI TestClient configured to override database dependency injections.
    """
    def _get_db_override():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
