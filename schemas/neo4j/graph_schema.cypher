// STRATUM PROTOCOL — Neo4j Urban Knowledge Graph Schema
// Run with: cypher-shell -u neo4j -p <password> < graph_schema.cypher

// ===========================================================================
// CONSTRAINTS — enforce node uniqueness
// ===========================================================================
CREATE CONSTRAINT urban_node_id IF NOT EXISTS
FOR (n:UrbanNode) REQUIRE n.node_id IS UNIQUE;

CREATE CONSTRAINT physical_node_id IF NOT EXISTS
FOR (n:PhysicalNode) REQUIRE n.node_id IS UNIQUE;

CREATE CONSTRAINT digital_node_id IF NOT EXISTS
FOR (n:DigitalNode) REQUIRE n.node_id IS UNIQUE;

CREATE CONSTRAINT economic_node_id IF NOT EXISTS
FOR (n:EconomicNode) REQUIRE n.node_id IS UNIQUE;

CREATE CONSTRAINT social_node_id IF NOT EXISTS
FOR (n:SocialNode) REQUIRE n.node_id IS UNIQUE;

CREATE CONSTRAINT city_id_unique IF NOT EXISTS
FOR (c:City) REQUIRE c.city_id IS UNIQUE;

// ===========================================================================
// INDEXES
// ===========================================================================
CREATE INDEX urban_node_city     IF NOT EXISTS FOR (n:UrbanNode)     ON (n.city_id);
CREATE INDEX urban_node_layer    IF NOT EXISTS FOR (n:UrbanNode)     ON (n.layer);
CREATE INDEX urban_node_crit     IF NOT EXISTS FOR (n:UrbanNode)     ON (n.criticality_score);
CREATE INDEX urban_node_vuln     IF NOT EXISTS FOR (n:UrbanNode)     ON (n.vulnerability_index);
CREATE INDEX urban_node_status   IF NOT EXISTS FOR (n:UrbanNode)     ON (n.status);
CREATE INDEX urban_node_sector   IF NOT EXISTS FOR (n:UrbanNode)     ON (n.sector_id);

// ===========================================================================
// SEED EXAMPLE GRAPH — New York City Infrastructure
// ===========================================================================

// City node
MERGE (nyc:City {city_id: 'NYC', name: 'New York City', country: 'US', population: 8336817});

// PHYSICAL LAYER — Power
MERGE (pp_a:UrbanNode:PhysicalNode {
    node_id: 'NYC-PWR-PP-A', label: 'Power Plant A',
    layer: 'physical', category: 'power', city_id: 'NYC', sector_id: 'SECTOR-7A',
    criticality_score: 0.95, vulnerability_index: 0.42, status: 'OPERATIONAL',
    capacity_mw: 2400, load_factor: 0.88, age_years: 22,
    lat: 40.7128, lon: -74.006
});

MERGE (sub_a14:UrbanNode:PhysicalNode {
    node_id: 'NYC-PWR-SUB-A14', label: 'Substation A14',
    layer: 'physical', category: 'power', city_id: 'NYC', sector_id: 'SECTOR-7A',
    criticality_score: 0.88, vulnerability_index: 0.61, status: 'OPERATIONAL',
    capacity_mw: 800, load_factor: 0.94, age_years: 35
});

MERGE (wtp_01:UrbanNode:PhysicalNode {
    node_id: 'NYC-WTR-WTP-01', label: 'Water Filtration Plant 01',
    layer: 'physical', category: 'water', city_id: 'NYC', sector_id: 'SECTOR-8B',
    criticality_score: 0.91, vulnerability_index: 0.72, status: 'DEGRADED',
    capacity_mgd: 450, load_factor: 0.78
});

MERGE (hospital:UrbanNode:PhysicalNode {
    node_id: 'NYC-MED-GEN-HOSP', label: 'General Hospital',
    layer: 'physical', category: 'medical', city_id: 'NYC', sector_id: 'SECTOR-5C',
    criticality_score: 0.98, vulnerability_index: 0.25, status: 'OPERATIONAL',
    beds: 850, has_backup_power: true
});

// DIGITAL LAYER
MERGE (azure_dc:UrbanNode:DigitalNode {
    node_id: 'NYC-DIG-AZURE-DC', label: 'Azure Core DC',
    layer: 'digital', category: 'cloud', city_id: 'NYC', sector_id: 'SECTOR-6A',
    criticality_score: 0.87, vulnerability_index: 0.38, status: 'OPERATIONAL',
    uptime_sla: 0.9999, rack_capacity: 5000
});

MERGE (fiber_9:UrbanNode:DigitalNode {
    node_id: 'NYC-DIG-FIBER-9', label: 'Regional Fiber Node 9',
    layer: 'digital', category: 'network', city_id: 'NYC', sector_id: 'SECTOR-6B',
    criticality_score: 0.82, vulnerability_index: 0.44, status: 'OPERATIONAL',
    bandwidth_gbps: 400
});

// SOCIAL LAYER
MERGE (evac_a:UrbanNode:SocialNode {
    node_id: 'NYC-SOC-EVAC-A', label: 'Evacuation Center Alpha',
    layer: 'social', category: 'emergency', city_id: 'NYC', sector_id: 'SECTOR-9A',
    criticality_score: 0.76, vulnerability_index: 0.2, status: 'OPERATIONAL',
    capacity_persons: 12000
});

// ===========================================================================
// RELATIONSHIPS — Dependency Graph Edges
// ===========================================================================

// Power plant → Substation (physical power dependency)
MERGE (pp_a)-[r1:DEPENDS_ON {
    type: 'power_distribution',
    weight: 0.95,
    direction: 'output',
    failure_cascade_probability: 0.89,
    dependency_label: 'PRIMARY_FEED'
}]->(sub_a14);

// Substation → Water Treatment (power dependency)
MERGE (sub_a14)-[r2:DEPENDS_ON {
    type: 'power_supply',
    weight: 0.85,
    direction: 'supply',
    failure_cascade_probability: 0.72
}]->(wtp_01);

// Substation → Hospital
MERGE (sub_a14)-[r3:DEPENDS_ON {
    type: 'power_supply',
    weight: 0.98,
    direction: 'supply',
    failure_cascade_probability: 0.95  // hospital on grid = high cascade
}]->(hospital);

// Azure DC depends on power plant (data center power)
MERGE (pp_a)-[r4:DEPENDS_ON {
    type: 'power_supply',
    weight: 0.92,
    direction: 'supply',
    failure_cascade_probability: 0.85
}]->(azure_dc);

// Fiber node depends on Azure DC
MERGE (azure_dc)-[r5:DEPENDS_ON {
    type: 'network_routing',
    weight: 0.78,
    direction: 'routing',
    failure_cascade_probability: 0.65
}]->(fiber_9);

// City relationships
MERGE (nyc)-[:CONTAINS]->(pp_a);
MERGE (nyc)-[:CONTAINS]->(azure_dc);
MERGE (nyc)-[:CONTAINS]->(wtp_01);
MERGE (nyc)-[:CONTAINS]->(hospital);
MERGE (nyc)-[:CONTAINS]->(fiber_9);
MERGE (nyc)-[:CONTAINS]->(evac_a);
