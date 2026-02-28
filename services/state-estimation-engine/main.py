"""
STRATUM PROTOCOL — State Estimation Engine
Bayesian state estimation, LSTM anomaly detection,
hidden stress scoring, infrastructure fatigue, predictive maintenance.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.core.config import settings
from app.routers import estimation, anomaly, stress, maintenance, health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 State Estimation Engine starting...")
    logger.info("✅ State Estimation Engine ready")
    yield


app = FastAPI(
    title="STRATUM — Real-Time State Estimation Engine",
    description="Bayesian state estimation, LSTM anomaly detection, hidden stress scoring",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(estimation.router, prefix="/api/v1/estimation", tags=["State Estimation"])
app.include_router(anomaly.router, prefix="/api/v1/anomaly", tags=["Anomaly Detection"])
app.include_router(stress.router, prefix="/api/v1/stress", tags=["Stress Scoring"])
app.include_router(maintenance.router, prefix="/api/v1/maintenance", tags=["Predictive Maintenance"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=settings.DEBUG)
