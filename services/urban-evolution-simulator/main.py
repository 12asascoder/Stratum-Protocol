"""STRATUM — Urban Evolution Simulator: 5–30 year climate-urban forecasting."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, uvicorn
from app.core.config import settings
from app.routers import climate, sea_level, ev_adoption, population, infrastructure, health

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Urban Evolution Simulator starting...")
    logger.info("✅ Urban Evolution Simulator ready")
    yield

app = FastAPI(
    title="STRATUM — Long-Term Urban Evolution Simulator",
    description="5-30 year forecasting: climate migration, sea-level rise, EV adoption, population shifts",
    version="1.0.0", lifespan=lifespan, docs_url="/api/docs",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(climate.router, prefix="/api/v1/climate", tags=["Climate Migration"])
app.include_router(sea_level.router, prefix="/api/v1/sea-level", tags=["Sea Level"])
app.include_router(ev_adoption.router, prefix="/api/v1/ev", tags=["EV Adoption"])
app.include_router(population.router, prefix="/api/v1/population", tags=["Population"])
app.include_router(infrastructure.router, prefix="/api/v1/infrastructure", tags=["Infrastructure Stress"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8013, reload=settings.DEBUG)
