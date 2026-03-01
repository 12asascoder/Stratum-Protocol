from fastapi import APIRouter, HTTPException, Request
from typing import Optional

router = APIRouter()

@router.post("/")
async def create_edge(
    request: Request, 
    from_id: str, 
    to_id: str, 
    type: str, 
    weight: float = 1.0
):
    from app.graph.repository import KnowledgeGraphRepository
    repo = KnowledgeGraphRepository(request.app.state.neo4j)
    success = await repo.create_dependency_edge(from_id, to_id, type, weight)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create edge")
    return {"status": "created"}
