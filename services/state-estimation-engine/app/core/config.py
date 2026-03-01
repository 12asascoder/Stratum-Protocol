from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("STRATUM_ENV", "development") == "development"
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    TOPIC_VALIDATED_EVENTS: str = "stratum.validated.events"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
