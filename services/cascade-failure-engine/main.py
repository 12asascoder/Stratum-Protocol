"""
STRATUM PROTOCOL — Cascading Failure Simulation Engine
GPU-accelerated multi-hop failure propagation using PyTorch Geometric.
Simulates climate stress, cyber-physical attacks, load redistribution,
economic shockwaves, and collapse probability indexing.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn
import torch

from app.core.config import settings
from app.routers import simulation, scenarios, health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Cascade Failure Engine starting...")

    # Detect GPU availability (ROCm or CUDA)
    if torch.cuda.is_available():
        device = "cuda"
    elif hasattr(torch, "hip") and torch.hip.is_available():
        device = "cuda"  # ROCm presents as CUDA in PyTorch
    else:
        device = "cpu"
        logger.warning("⚠️  No GPU detected — simulations will run on CPU")

    app.state.device = device
    logger.info(f"✅ Cascade Failure Engine ready — Device: {device.upper()}")
    yield


app = FastAPI(
    title="STRATUM — Cascading Failure Simulation Engine",
    description="GPU-accelerated multi-hop failure propagation, climate stress, cyber-physical attack simulation",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["Simulation"])
app.include_router(scenarios.router, prefix="/api/v1/scenarios", tags=["Scenarios"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=settings.DEBUG)
