"""
STRATUM PROTOCOL — Data Ingestion Service
Kafka producers, MQTT ingestion, data validation, schema enforcement,
outlier detection, time-series normalization, fault tolerance.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.core.config import settings
from app.core.logging import configure_logging
from app.routers import ingest, health, streams
from app.kafka.producer import KafkaProducerManager
from app.kafka.consumer import KafkaConsumerManager

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle management."""
    configure_logging()
    logger.info("🚀 Data Ingestion Service starting up...")

    # Initialize Kafka producer pool
    app.state.producer = KafkaProducerManager()
    await app.state.producer.start()

    # Start MQTT consumer in background
    app.state.consumer = KafkaConsumerManager()
    await app.state.consumer.start()

    logger.info("✅ Data Ingestion Service ready")
    yield

    logger.info("🛑 Data Ingestion Service shutting down...")
    await app.state.producer.stop()
    await app.state.consumer.stop()


app = FastAPI(
    title="STRATUM — Data Ingestion Service",
    description="Real-time multi-source urban data ingestion with validation and fault tolerance",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["Ingestion"])
app.include_router(streams.router, prefix="/api/v1/streams", tags=["Streams"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=settings.DEBUG)
