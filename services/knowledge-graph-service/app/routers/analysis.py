from fastapi import APIRouter, Request
from typing import Optional

router = APIRouter()

@router.get("/criticality/{city_id}")
async def get_criticality_ranking(request: Request, city_id: str):
    from app.graph.repository import KnowledgeGraphRepository
    repo = KnowledgeGraphRepository(request.app.state.neo4j)
    return await repo.compute_criticality_ranking(city_id)

@router.get("/vulnerability/{city_id}")
async def get_vulnerability_index(request: Request, city_id: str):
    from app.graph.repository import KnowledgeGraphRepository
    repo = KnowledgeGraphRepository(request.app.state.neo4j)
    return await repo.get_vulnerability_index(city_id)

@router.get("/cascade/{node_id}")
async def get_cascading_paths(request: Request, node_id: str, max_hops: int = 5):
    from app.graph.repository import KnowledgeGraphRepository
    repo = KnowledgeGraphRepository(request.app.state.neo4j)
    return await repo.get_cascading_paths(node_id, max_hops=max_hops)
