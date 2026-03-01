from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_VERSION: str = "1.0.0"
    STRATUM_ENV: str = os.getenv("STRATUM_ENV", "development")
    DEBUG: bool = STRATUM_ENV == "development"
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "stratum_super_secret_key_change_me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # System Users (for dev/testing)
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "stratum_admin_secret")

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
