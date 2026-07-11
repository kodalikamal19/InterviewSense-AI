from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.utils.config import settings
from app.utils.logger import get_logger
from app.utils.exceptions import register_exception_handlers

# Import routers
from app.api.candidates import router as candidates_router
from app.api.jobs import router as jobs_router
from app.api.interviews import router as interviews_router
from app.api.reports import router as reports_router

logger = get_logger("app.main")

app = FastAPI(
    title="InterviewSense AI API",
    description="Backend API for InterviewSense AI -- Interview Intelligence Prototype",
    version="1.0.0"
)

# CORS middleware configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom global exception handlers
register_exception_handlers(app)

# Register API Routers under /api prefix
app.include_router(candidates_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(interviews_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

@app.get("/")
async def root():
    """
    Root route providing basic API info.
    """
    return {
        "app": "InterviewSense AI API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "upload_directory": settings.UPLOAD_DIR
    }

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for the backend services.
    """
    database_status = "connected"
    try:
        from app.database.connection import db
        db.command("ping")
    except Exception:
        database_status = "disconnected"

    return {
        "status": "healthy",
        "database": database_status,
        "services": {
            "whisper": "available",
            "openai": "available" if settings.OPENAI_API_KEY else "unavailable"
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server at {settings.HOST}:{settings.PORT}...")
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
