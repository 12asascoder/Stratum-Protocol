"""STRATUM — Orchestration Engine: intelligence-to-action dispatcher."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, uvicorn
from app.core.config import settings
from app.routers import traffic, energy, dispatch, alerts, coordination, health

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Orchestration Engine starting...")
    logger.info("✅ Orchestration Engine ready")
    yield

app = FastAPI(
    title="STRATUM — Orchestration Engine",
    description="Intelligence-to-action: traffic, energy, dispatch, alerts, cross-agency coordination",
    version="1.0.0", lifespan=lifespan, docs_url="/api/docs",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(traffic.router, prefix="/api/v1/actions/traffic", tags=["Traffic"])
app.include_router(energy.router, prefix="/api/v1/actions/energy", tags=["Energy"])
app.include_router(dispatch.router, prefix="/api/v1/actions/dispatch", tags=["Dispatch"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(coordination.router, prefix="/api/v1/coordination", tags=["Coordination"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8012, reload=settings.DEBUG)
