"""STRATUM — Cyber-Physical Defense Engine: adversarial telemetry, synthetic signal, poisoning detection."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, uvicorn
from app.core.config import settings
from app.routers import telemetry, synthetic, poisoning, heatmap, containment, health

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Cyber-Physical Defense Engine starting...")
    logger.info("✅ Cyber-Physical Defense Engine ready")
    yield

app = FastAPI(
    title="STRATUM — Cyber-Physical Defense Engine",
    description="Adversarial telemetry detection, synthetic signal classification, AI poisoning detection",
    version="1.0.0", lifespan=lifespan, docs_url="/api/docs",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["Telemetry Defense"])
app.include_router(synthetic.router, prefix="/api/v1/synthetic", tags=["Synthetic Signal"])
app.include_router(poisoning.router, prefix="/api/v1/poisoning", tags=["Poisoning Detection"])
app.include_router(heatmap.router, prefix="/api/v1/heatmap", tags=["Risk Heatmap"])
app.include_router(containment.router, prefix="/api/v1/containment", tags=["Containment"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8011, reload=settings.DEBUG)
