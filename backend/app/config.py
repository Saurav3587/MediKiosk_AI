import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env from backend directory or project root
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
backend_env = Path(__file__).resolve().parent.parent / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
elif root_env.exists():
    load_dotenv(root_env)


class Settings(BaseSettings):
    PROJECT_NAME: str = "MediKiosk API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medikiosk_super_secret_jwt_key_2026_clinical_hipaa")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # PostgreSQL / SQLite Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./medikiosk.db")
    
    # LLM Provider Configuration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "sarvam") # 'sarvam' | 'biomistral' | 'openai'
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Fast2SMS OTP Gateway
    FAST2SMS_API_KEY: str = os.getenv("FAST2SMS_API_KEY", "")
    
    # Sarvam AI (Indian Language Voice ASR, TTS & Translation)
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    
    # CORS settings
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
