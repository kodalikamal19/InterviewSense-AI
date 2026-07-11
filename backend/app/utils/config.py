import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    """
    Application settings class using pydantic-settings.
    Loads variables from Environment or a local .env file.
    """
    # Server configs
    HOST: str = Field(default="127.0.0.1", description="FastAPI host address")
    PORT: int = Field(default=8000, description="FastAPI port number")
    SECRET_KEY: str = Field(
        default="change_this_to_a_secure_random_key_before_deploying_or_running",
        description="Secret key for JWT and session management"
    )

    # Database
    DATABASE_URL: str = Field(
        default="mongodb://localhost:27017/interviewsense",
        description="MongoDB connection string (local or Atlas)"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def check_db_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres"):
            # If the user still has a postgres URL in env, we will fallback to a default local mongodb URL
            return "mongodb://localhost:27017/interviewsense"
        return v

    # External APIs
    OPENAI_API_KEY: str = Field(default="", description="OpenAI developer API key")
    HF_TOKEN: str = Field(default="", description="Hugging Face authorization token")

    # Local Filesystem paths
    UPLOAD_DIR: str = Field(default="./uploads", description="Directory to store uploaded resumes and audio files")

    # AI Model settings
    WHISPER_MODEL: str = Field(default="base", description="Whisper speech transcription model type")

    # Pydantic configuration to load from .env file if available
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # ignores extra fields loaded from env
    )

# Instantiate a global settings object
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
