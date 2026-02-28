"""
STRATUM PROTOCOL — Sovereign Governance Layer
Explainable AI reasoning chains, bias detection, ethical guardrails,
ESG compliance, data residency enforcement, and audit trail API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.core.config import settings
from app.routers import governance, xai, bias, compliance, audit, health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Sovereign Governance Layer starting...")
    logger.info("✅ Sovereign Governance Layer ready")
    yield


app = FastAPI(
    title="STRATUM — Sovereign Governance Layer",
    description="XAI reasoning chains, bias detection, ethical guardrails, ESG compliance",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(governance.router, prefix="/api/v1/governance", tags=["Governance"])
app.include_router(xai.router, prefix="/api/v1/xai", tags=["Explainability"])
app.include_router(bias.router, prefix="/api/v1/bias", tags=["Bias Detection"])
app.include_router(compliance.router, prefix="/api/v1/compliance", tags=["ESG Compliance"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=settings.DEBUG)
