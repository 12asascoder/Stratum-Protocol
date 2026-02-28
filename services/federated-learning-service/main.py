"""
STRATUM PROTOCOL — Federated Learning Service
Flower-based federated coordination with differential privacy,
secure aggregation, and cross-city model benchmarking.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
import uvicorn

from app.core.config import settings
from app.flower.server import StratumFederatedServer
from app.routers import federation, models, health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Federated Learning Service starting...")

    app.state.fl_server = StratumFederatedServer(
        num_rounds=settings.FL_ROUNDS,
        min_clients=settings.FL_MIN_CLIENTS,
        dp_epsilon=settings.FL_DP_EPSILON,
        dp_delta=settings.FL_DP_DELTA,
        dp_max_grad_norm=settings.FL_DP_MAX_GRAD_NORM,
    )

    # Start Flower gRPC server in background
    app.state.fl_task = asyncio.create_task(app.state.fl_server.start_async())
    logger.info(f"✅ Flower federated server started on :{settings.FL_SERVER_PORT}")
    yield

    app.state.fl_task.cancel()


app = FastAPI(
    title="STRATUM — Federated Learning Service",
    description="Cross-city federated model training with differential privacy",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(federation.router, prefix="/api/v1/federation", tags=["Federation"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Models"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8009, reload=settings.DEBUG)
