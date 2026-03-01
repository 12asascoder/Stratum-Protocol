"""
Knowledge Graph Repository — Neo4j query layer for STRATUM urban graph.
Implements multi-layer graph (Physical, Digital, Economic, Social) with
dependency scoring, vulnerability indexing, and criticality ranking.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import logging

from app.graph.connection import Neo4jConnectionPool

logger = logging.getLogger(__name__)

# Node labels per graph layer
PHYSICAL_NODES = ["PowerPlant", "Substation", "WaterTreatment", "TransportHub", "Bridge", "Hospital", "DataCenter"]
DIGITAL_NODES = ["NetworkNode", "FiberLink", "CDN", "CloudRegion", "DNSServer"]
ECONOMIC_NODES = ["FinancialHub", "SupplyChainNode", "LogisticsCenter", "CommercialZone"]
SOCIAL_NODES = ["ResidentialZone", "EmergencyCenter", "EvacuationPoint", "SocialCluster"]


class UrbanNode:
    def __init__(self, data: Dict):
        self.node_id: str = data["node_id"]
        self.label: str = data["label"]
        self.layer: str = data.get("layer", "physical")
        self.city_id: str = data["city_id"]
        self.sector_id: str = data.get("sector_id", "UNKNOWN")
        self.criticality_score: float = data.get("criticality_score", 0.5)
        self.vulnerability_index: float = data.get("vulnerability_index", 0.5)
        self.dependency_count: int = data.get("dependency_count", 0)
        self.last_health_check: Optional[datetime] = data.get("last_health_check")
        self.metadata: Dict = data.get("metadata", {})
        self.status: str = data.get("status", "OPERATIONAL")

    def to_cypher_props(self) -> Dict:
        return {
            "node_id": self.node_id,
            "label": self.label,
            "layer": self.layer,
            "city_id": self.city_id,
            "sector_id": self.sector_id,
            "criticality_score": self.criticality_score,
            "vulnerability_index": self.vulnerability_index,
            "dependency_count": self.dependency_count,
            "status": self.status,
            "updated_at": datetime.utcnow().isoformat(),
        }


class KnowledgeGraphRepository:
    """CRUD and analytical operations on the urban knowledge graph."""

    def __init__(self, pool: Neo4jConnectionPool):
        self.pool = pool

    async def upsert_node(self, node: UrbanNode) -> Dict:
        query = """
        MERGE (n:UrbanNode {node_id: $node_id})
        SET n += $props
        SET n:Layer_{layer}
        RETURN n
        """.replace("{layer}", node.layer.capitalize())

        async with await self.pool.get_session() as session:
            result = await session.run(query, node_id=node.node_id, props=node.to_cypher_props())
            record = await result.single()
            return dict(record["n"]) if record else {}

    async def create_dependency_edge(
        self,
        from_node_id: str,
        to_node_id: str,
        dependency_type: str,
        weight: float = 1.0,
        properties: Optional[Dict] = None,
    ) -> bool:
        query = """
        MATCH (a:UrbanNode {node_id: $from_id})
        MATCH (b:UrbanNode {node_id: $to_id})
        MERGE (a)-[r:DEPENDS_ON {type: $dep_type}]->(b)
        SET r.weight = $weight,
            r.created_at = $created_at,
            r += $props
        RETURN r
        """
        async with await self.pool.get_session() as session:
            result = await session.run(
                query,
                from_id=from_node_id,
                to_id=to_node_id,
                dep_type=dependency_type,
                weight=weight,
                created_at=datetime.utcnow().isoformat(),
                props=properties or {},
            )
            return await result.single() is not None

    async def get_cascading_paths(
        self, start_node_id: str, max_hops: int = 5, min_weight: float = 0.3
    ) -> List[Dict]:
        """
        Find all cascading failure paths from a source node using variable-length
        path traversal, weighted by dependency strength.
        """
        query = """
        MATCH path = (start:UrbanNode {node_id: $start_id})-[r:DEPENDS_ON*1..%d]->(end:UrbanNode)
        WHERE ALL(rel IN relationships(path) WHERE rel.weight >= $min_weight)
        WITH path, 
             [n IN nodes(path) | n.node_id] AS node_ids,
             [r IN relationships(path) | r.weight] AS weights,
             reduce(total_weight = 1.0, w IN [rel IN relationships(path) | rel.weight] | total_weight * w) AS cascade_probability
        RETURN node_ids, weights, cascade_probability,
               length(path) AS hop_count
        ORDER BY cascade_probability DESC
        LIMIT 50
        """ % max_hops

        async with await self.pool.get_session() as session:
            result = await session.run(query, start_id=start_node_id, min_weight=min_weight)
            records = await result.data()
            return records

    async def compute_criticality_ranking(self, city_id: str) -> List[Dict]:
        """
        Compute criticality ranking using PageRank-inspired algorithm
        considering: in-degree, out-degree, dependency weights, and layer.
        """
        query = """
        MATCH (n:UrbanNode {city_id: $city_id})
        OPTIONAL MATCH (n)<-[r_in:DEPENDS_ON]-(dep)
        OPTIONAL MATCH (n)-[r_out:DEPENDS_ON]->(dep2)
        WITH n,
             count(DISTINCT dep) AS downstream_dependents,
             count(DISTINCT dep2) AS upstream_dependencies,
             coalesce(sum(r_in.weight), 0) AS total_dependency_weight
        SET n.criticality_score = (downstream_dependents * 0.6 + total_dependency_weight * 0.4) / 
                                   (1 + upstream_dependencies * 0.1),
            n.dependency_count = downstream_dependents + upstream_dependencies
        RETURN n.node_id AS node_id,
               n.label AS label,
               n.layer AS layer,
               n.criticality_score AS criticality_score,
               n.vulnerability_index AS vulnerability_index,
               downstream_dependents,
               upstream_dependencies
        ORDER BY n.criticality_score DESC
        LIMIT 100
        """
        async with await self.pool.get_session() as session:
            result = await session.run(query, city_id=city_id)
            return await result.data()

    async def get_vulnerability_index(self, city_id: str) -> Dict:
        """Compute city-wide vulnerability index across all layers."""
        query = """
        MATCH (n:UrbanNode {city_id: $city_id})
        WITH n.layer AS layer,
             avg(n.vulnerability_index) AS avg_vulnerability,
             avg(n.criticality_score) AS avg_criticality,
             count(n) AS node_count,
             collect(CASE WHEN n.status <> 'OPERATIONAL' THEN n.node_id END) AS degraded_nodes
        RETURN layer, avg_vulnerability, avg_criticality, node_count, degraded_nodes
        ORDER BY avg_vulnerability DESC
        """
        async with await self.pool.get_session() as session:
            result = await session.run(query, city_id=city_id)
            records = await result.data()

            total_nodes = sum(r["node_count"] for r in records)
            total_degraded = sum(len([n for n in r["degraded_nodes"] if n]) for r in records)

            return {
                "city_id": city_id,
                "global_resilience_score": max(
                    0, 100 * (1 - total_degraded / max(total_nodes, 1))
                ),
                "layer_breakdown": records,
                "total_nodes": total_nodes,
                "degraded_nodes": total_degraded,
            }

    async def search_nodes(
        self,
        city_id: str,
        layer: Optional[str] = None,
        min_criticality: float = 0.0,
        limit: int = 100,
    ) -> List[Dict]:
        where_clauses = ["n.city_id = $city_id", "n.criticality_score >= $min_criticality"]
        if layer:
            where_clauses.append("n.layer = $layer")

        query = f"""
        MATCH (n:UrbanNode)
        WHERE {' AND '.join(where_clauses)}
        RETURN n
        ORDER BY n.criticality_score DESC
        LIMIT {limit}
        """
        params = {"city_id": city_id, "min_criticality": min_criticality, "layer": layer}
        async with await self.pool.get_session() as session:
            result = await session.run(query, **params)
            records = await result.data()
            return [dict(r["n"]) for r in records]
