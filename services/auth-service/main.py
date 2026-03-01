"""
STRATUM PROTOCOL — Auth Service
Centralized authentication and authorization, JWT/OAuth2 provider, 
Role-Based Access Control (RBAC), security audit logging.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

# Imports follow the structure in other services
from app.core.config import settings
from app.routers import health, auth

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic"""
    logger.info("🚀 STRATUM Auth Service starting up...")
    # Initialize crypto secrets, database connections, etc. if needed
    logger.info("✅ STRATUM Auth Service ready")
    yield
    logger.info("🛑 STRATUM Auth Service shutting down...")

app = FastAPI(
    title="STRATUM — Auth Service",
    description="Identity Provider & RBAC Gateway",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

if __name__ == "__main__":
    # Note: When running in Docker, CMD overrides these defaults
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
