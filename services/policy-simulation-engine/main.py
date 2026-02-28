"""STRATUM — Policy Simulation Engine: Monte Carlo + NSGA-II multi-objective optimization."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, uvicorn
from app.core.config import settings
from app.routers import monte_carlo, optimization, feasibility, health

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Policy Simulation Engine starting...")
    logger.info("✅ Policy Simulation Engine ready")
    yield

app = FastAPI(
    title="STRATUM — Autonomous Policy Simulation Engine",
    description="Monte Carlo simulation, NSGA-II multi-objective optimization, political feasibility scoring",
    version="1.0.0", lifespan=lifespan, docs_url="/api/docs",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(monte_carlo.router, prefix="/api/v1/monte-carlo", tags=["Monte Carlo"])
app.include_router(optimization.router, prefix="/api/v1/optimization", tags=["Optimization"])
app.include_router(feasibility.router, prefix="/api/v1/feasibility", tags=["Feasibility"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8006, reload=settings.DEBUG)
