from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Any, Dict
import time
import logging

from app.validators.schema import SchemaValidator, SensorPayload, ValidationResult
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Global validator instance
validator = SchemaValidator()

@router.post("")
@router.post("/")
async def ingest_sensor_data(request: Request, payload: Dict[str, Any]):
    """
    Ingest raw sensor data, validate against schema, and produce to Kafka.
    """
    start_time = time.perf_counter()
    
    # 1. Validate payload
    result: ValidationResult = validator.validate(payload)
    
    if not result.valid:
        logger.warning(f"❌ Validation failed for payload from {payload.get('source_id')}: {result.errors}")
        raise HTTPException(status_code=422, detail={"errors": result.errors, "message": "Schema validation failed"})

    # 2. Add quality score and metadata if needed
    processed_payload = result.payload.dict()
    processed_payload["quality_score"] = result.quality_score
    processed_payload["ingested_at_ms"] = int(time.time() * 1000)
    processed_payload["outlier_flags"] = result.outlier_flags

    # 3. Produce to Kafka
    producer = request.app.state.producer
    success = await producer.produce(
        topic=settings.TOPIC_VALIDATED_EVENTS,
        value=processed_payload,
        key=result.payload.sensor_id
    )

    if not success:
        logger.error(f"Failed to produce message to Kafka topic: {settings.TOPIC_VALIDATED_EVENTS}")
        # We still return 202 as the producer manager handles DLQ
    
    return {
        "status": "accepted",
        "sensor_id": result.payload.sensor_id,
        "quality_score": result.quality_score,
        "processing_time_ms": (time.perf_counter() - start_time) * 1000,
        "outliers_detected": sum(result.outlier_flags.values())
    }

@router.get("/stats")
async def get_ingestion_stats():
    """Return ingestion service statistics."""
    return {
        "validator": validator.stats,
        "timestamp": time.time()
    }
