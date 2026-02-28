"""STRATUM — Capital Optimization Engine: ROI, GDP impact, bond pricing, carbon credit."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, uvicorn
from app.core.config import settings
from app.routers import roi, gdp, bonds, carbon, allocation, health

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Capital Optimization Engine starting...")
    logger.info("✅ Capital Optimization Engine ready")
    yield

app = FastAPI(
    title="STRATUM — Economic & Capital Optimization Engine",
    description="Infrastructure ROI modeling, GDP impact, bond pricing simulation, carbon credit forecasting",
    version="1.0.0", lifespan=lifespan, docs_url="/api/docs",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(roi.router, prefix="/api/v1/roi", tags=["ROI Modeling"])
app.include_router(gdp.router, prefix="/api/v1/gdp", tags=["GDP Impact"])
app.include_router(bonds.router, prefix="/api/v1/bonds", tags=["Bond Pricing"])
app.include_router(carbon.router, prefix="/api/v1/carbon", tags=["Carbon Credits"])
app.include_router(allocation.router, prefix="/api/v1/allocation", tags=["Capital Allocation"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8007, reload=settings.DEBUG)
