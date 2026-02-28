from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("STRATUM_ENV", "development") == "development"
    ALLOWED_ORIGINS: List[str] = ["*"]

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_SECURITY_PROTOCOL: str = "PLAINTEXT"
    KAFKA_SASL_USERNAME: str = ""
    KAFKA_SASL_PASSWORD: str = ""
    KAFKA_SCHEMA_REGISTRY_URL: str = "http://localhost:8081"

    # Topics
    TOPIC_RAW_SENSOR_DATA: str = "stratum.raw.sensor-data"
    TOPIC_VALIDATED_EVENTS: str = "stratum.validated.events"
    TOPIC_ANOMALY_ALERTS: str = "stratum.alerts.anomaly"
    TOPIC_DLQ: str = "stratum.dlq.ingestion"

    # TimescaleDB
    TIMESCALE_URL: str = "postgresql+asyncpg://stratum_ts:stratum_ts_secret@localhost:5433/stratum_timeseries"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: str = "stratum_redis_secret"

    # MQTT
    MQTT_BROKER_HOST: str = "localhost"
    MQTT_BROKER_PORT: int = 1883
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    MQTT_TOPICS: List[str] = ["urban/+/sensors/#", "traffic/+/status", "energy/+/consumption"]

    # Validation
    OUTLIER_ZSCORE_THRESHOLD: float = 3.5
    BATCH_SIZE: int = 500
    BATCH_FLUSH_INTERVAL_SECONDS: float = 1.0

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
