"""
STRATUM PROTOCOL — Knowledge Graph Service
Neo4j graph modeling, multi-layer urban graph, real-time mutation,
dependency scoring, vulnerability index, criticality ranking.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.core.config import settings
from app.core.logging import configure_logging
from app.graph.connection import Neo4jConnectionPool
from app.routers import nodes, edges, analysis, health
from app.grpc import start_grpc_server

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("🚀 Knowledge Graph Service starting up...")

    app.state.neo4j = Neo4jConnectionPool(
        uri=settings.NEO4J_URI,
        user=settings.NEO4J_USER,
        password=settings.NEO4J_PASSWORD,
        database=settings.NEO4J_DATABASE,
    )
    await app.state.neo4j.connect()
    await app.state.neo4j.ensure_schema()

    # Start gRPC server for high-performance inter-service calls
    app.state.grpc_server = await start_grpc_server(port=50051)

    logger.info("✅ Knowledge Graph Service ready — gRPC on :50051, REST on :8002")
    yield

    await app.state.neo4j.close()
    await app.state.grpc_server.stop(grace=5)


app = FastAPI(
    title="STRATUM — Urban Knowledge Graph Service",
    description="Multi-layer urban knowledge graph: physical, digital, economic, social layers",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(nodes.router, prefix="/api/v1/nodes", tags=["Nodes"])
app.include_router(edges.router, prefix="/api/v1/edges", tags=["Edges"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=settings.DEBUG)
