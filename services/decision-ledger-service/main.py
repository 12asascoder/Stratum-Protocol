"""
STRATUM PROTOCOL — Decision Ledger Service
Immutable append-only log with cryptographic hash chain (Merkle tree).
Every AI recommendation, human override, and outcome is stored and verifiable.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.core.config import settings
from app.db.connection import init_db
from app.routers import ledger, audit, merkle, health

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Decision Ledger Service starting...")
    await init_db()
    logger.info("✅ Decision Ledger Service ready")
    yield


app = FastAPI(
    title="STRATUM — Global Accountability Ledger",
    description="Immutable cryptographic decision log with Merkle-tree verification",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(ledger.router, prefix="/api/v1/ledger", tags=["Ledger"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit"])
app.include_router(merkle.router, prefix="/api/v1/merkle", tags=["Merkle Verification"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8008, reload=settings.DEBUG)
