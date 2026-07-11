import os
import shutil
import uuid
from fastapi import UploadFile
from app.utils.config import settings
from app.utils.exceptions import InvalidFileError
from app.utils.logger import get_logger

logger = get_logger("app.file_helper")

# Allowed extensions mapped by type
ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm"}

def validate_extension(filename: str, allowed_extensions: set) -> str:
    """
    Validates the extension of the given filename against allowed extensions.
    Returns the lowercased extension with dot.
    """
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext not in allowed_extensions:
        logger.warning(f"File extension validation failed: {filename} (extension: '{ext}') not in {allowed_extensions}")
        raise InvalidFileError(
            message=f"Invalid file extension. Allowed extensions are: {', '.join(allowed_extensions)}"
        )
    return ext

def save_uploaded_file(upload_file: UploadFile, subfolder: str, allowed_extensions: set) -> str:
    """
    Saves an uploaded FastAPI file to the settings.UPLOAD_DIR / subfolder.
    Uses a UUID name to prevent filename collision.
    Returns the absolute path to the saved file.
    """
    try:
        # Validate extension
        ext = validate_extension(upload_file.filename, allowed_extensions)
        
        # Build target directory
        target_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
        os.makedirs(target_dir, exist_ok=True)
        
        # Build target file path
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(target_dir, unique_filename)
        
        # Save file to disk
        logger.info(f"Saving uploaded file '{upload_file.filename}' to '{file_path}'")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        return os.path.abspath(file_path)
    except Exception as e:
        if not isinstance(e, InvalidFileError):
            logger.error(f"Failed to save uploaded file '{upload_file.filename}': {str(e)}", exc_info=True)
            raise InvalidFileError(message=f"Failed to upload file: {str(e)}")
        raise e

def delete_file(file_path: str):
    """
    Helper function to delete a file from the filesystem.
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted file from path: {file_path}")
    except Exception as e:
        logger.error(f"Error deleting file '{file_path}': {str(e)}")
