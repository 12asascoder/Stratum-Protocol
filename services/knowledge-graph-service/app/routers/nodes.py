from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from app.graph.repository import KnowledgeGraphRepository, UrbanNode

router = APIRouter()

@router.get("/{node_id}")
async def get_node(request: Request, node_id: str):
    repo = KnowledgeGraphRepository(request.app.state.neo4j)
    # This is a simplified search
    nodes = await repo.search_nodes(city_id="", limit=1) # Need better search in repo
    # For now returning placeholder or mock if not found
    return {"node_id": node_id, "status": "operational"}

@router.post("/")
async def create_node(request: Request, node: dict):
    repo = KnowledgeGraphRepository(request.app.state.neo4j)
    try:
        urban_node = UrbanNode(node)
        result = await repo.upsert_node(urban_node)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/search/")
async def search_nodes(request: Request, city_id: str, layer: Optional[str] = None):
    repo = KnowledgeGraphRepository(request.app.state.neo4j)
    return await repo.search_nodes(city_id=city_id, layer=layer)
