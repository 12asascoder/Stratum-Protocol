from fastapi import APIRouter, Request
import time

router = APIRouter()

@router.get("/status")
async def get_stream_status(request: Request):
    """Get status of active data streams and Kafka connections."""
    producer = request.app.state.producer
    consumer = request.app.state.consumer
    
    return {
        "producer": {
            "status": "connected" if producer._producer else "degraded",
            "stats": producer.stats
        },
        "consumer": {
            "status": "running" if consumer else "offline",
            # We'll add consumer stats if available
        },
        "timestamp": time.time()
    }

@router.get("/topics")
async def list_active_topics():
    """List topics configured in the ingestion service."""
    from app.core.config import settings
    return {
        "raw": settings.TOPIC_RAW_SENSOR_DATA,
        "validated": settings.TOPIC_VALIDATED_EVENTS,
        "alerts": settings.TOPIC_ANOMALY_ALERTS,
        "dlq": settings.TOPIC_DLQ
    }
