from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.utils.logger import get_logger

logger = get_logger("app.exceptions")

class AppException(Exception):
    """Base application exception."""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class EntityNotFoundError(AppException):
    """Exception raised when a requested resource is not found."""
    def __init__(self, message: str = "Resource not found", details: dict = None):
        super().__init__(message, status_code=404, details=details)

class InvalidFileError(AppException):
    """Exception raised when an uploaded file is invalid."""
    def __init__(self, message: str = "Invalid file payload", details: dict = None):
        super().__init__(message, status_code=400, details=details)

class AIServiceError(AppException):
    """Exception raised when an AI service (OpenAI, Whisper, pyannote) fails."""
    def __init__(self, message: str = "AI service failure", details: dict = None):
        super().__init__(message, status_code=502, details=details)

class DatabaseError(AppException):
    """Exception raised when a database operation fails."""
    def __init__(self, message: str = "Database operation failure", details: dict = None):
        super().__init__(message, status_code=500, details=details)

def register_exception_handlers(app: FastAPI):
    """
    Registers global exception handlers for the FastAPI app.
    """
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.error(f"AppException raised: {exc.message} | URL: {request.url} | Status: {exc.status_code} | Details: {exc.details}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "type": exc.__class__.__name__,
                    "details": exc.details
                }
            }
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.warning(f"HTTPException: {exc.detail} | URL: {request.url} | Status: {exc.status_code}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.detail,
                    "type": "HTTPException",
                    "details": {}
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = exc.errors()
        logger.warning(f"Validation Error | URL: {request.url} | Details: {details}")
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "message": "Input validation failed",
                    "type": "RequestValidationError",
                    "details": details
                }
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.critical(f"Unhandled Exception occurred: {str(exc)} | URL: {request.url}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "message": "An unexpected server error occurred",
                    "type": "UnhandledException",
                    "details": {"error_message": str(exc)}
                }
            }
        )
