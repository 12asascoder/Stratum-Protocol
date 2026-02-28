"""STRATUM — Citizen Behavior Engine: Mesa agent-based modeling."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, uvicorn
from app.core.config import settings
from app.routers import simulation, agents, evacuation, health

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Citizen Behavior Engine starting...")
    logger.info("✅ Citizen Behavior Engine ready")
    yield

app = FastAPI(
    title="STRATUM — Citizen Behavior Engine",
    description="Agent-based panic mobility, evacuation modeling, public compliance, social unrest detection",
    version="1.0.0", lifespan=lifespan, docs_url="/api/docs",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["Simulation"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["Agents"])
app.include_router(evacuation.router, prefix="/api/v1/evacuation", tags=["Evacuation"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8005, reload=settings.DEBUG)
