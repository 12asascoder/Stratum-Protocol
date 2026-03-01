"""
Neo4j Connection Management for STRATUM Knowledge Graph Service.
"""

import logging
from typing import Optional
from neo4j import AsyncGraphDatabase, AsyncDriver, AsyncSession

logger = logging.getLogger(__name__)

class Neo4jConnectionPool:
    def __init__(self, uri: str, user: str, password: str, database: str):
        self.uri = uri
        self.user = user
        self.password = password
        self.database = database
        self._driver: Optional[AsyncDriver] = None

    async def connect(self):
        try:
            self._driver = AsyncGraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
                max_connection_pool_size=50,
                connection_acquisition_timeout=30,
            )
            await self._driver.verify_connectivity()
            logger.info(f"✅ Connected to Neo4j at {self.uri}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Neo4j: {e}")
            raise

    async def close(self):
        if self._driver:
            await self._driver.close()

    async def ensure_schema(self):
        """Create indexes and constraints if they don't exist."""
        constraints = [
            "CREATE CONSTRAINT IF NOT EXISTS FOR (n:UrbanNode) REQUIRE n.node_id IS UNIQUE",
            "CREATE INDEX IF NOT EXISTS FOR (n:UrbanNode) ON (n.city_id)",
            "CREATE INDEX IF NOT EXISTS FOR (n:UrbanNode) ON (n.layer)",
            "CREATE INDEX IF NOT EXISTS FOR (n:UrbanNode) ON (n.criticality_score)",
            "CREATE INDEX IF NOT EXISTS FOR (n:UrbanNode) ON (n.vulnerability_index)",
        ]
        async with self._driver.session(database=self.database) as session:
            for stmt in constraints:
                await session.run(stmt)
        logger.info("✅ Neo4j schema constraints and indexes ensured")

    async def get_session(self) -> AsyncSession:
        return self._driver.session(database=self.database)
