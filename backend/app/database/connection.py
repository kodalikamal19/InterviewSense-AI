from pymongo import MongoClient, ReturnDocument
from app.utils.config import settings
from app.utils.logger import get_logger

logger = get_logger("app.database.connection")

try:
    logger.info("Initializing MongoDB connection client...")
    # Create the MongoDB client
    client = MongoClient(settings.DATABASE_URL)
    
    # Get database name from connection string or default to 'interviewsense'
    try:
        db = client.get_default_database()
    except Exception:
        db = client["interviewsense"]
        
    logger.info(f"Connected to MongoDB database: {db.name}")
except Exception as e:
    logger.critical(f"Failed to create MongoDB client connection: {str(e)}", exc_info=True)
    raise e

def get_db():
    """
    Dependency generator yielding the MongoDB database context.
    """
    yield db

def get_next_sequence_value(sequence_name: str) -> int:
    """
    Atomically generates and returns the next auto-incrementing integer ID for a sequence.
    Uses a 'counters' collection in MongoDB.
    """
    counter = db["counters"].find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return counter["seq"]
