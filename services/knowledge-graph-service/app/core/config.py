from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("STRATUM_ENV", "development") == "development"
    
    # Neo4j
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "stratum_neo4j_secret")
    NEO4J_DATABASE: str = os.getenv("NEO4J_DATABASE", "neo4j")
    
    # Kafka (for graph updates from streams)
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    TOPIC_VALIDATED_EVENTS: str = "stratum.validated.events"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
