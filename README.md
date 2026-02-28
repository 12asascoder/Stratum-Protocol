# STRATUM PROTOCOL
## Urban Decision Intelligence & Resilience Infrastructure Layer

> A production-grade, sovereign AI infrastructure platform for real-time urban analytics, cascading failure simulation, citizen behavior modeling, and autonomous policy governance.

![Version](https://img.shields.io/badge/version-1.0.0-cyan)
![License](https://img.shields.io/badge/license-Sovereign--Proprietary-red)
![Status](https://img.shields.io/badge/status-production--grade-green)

---

## Architecture Overview

STRATUM PROTOCOL is a **clean architecture + domain-driven design** monorepo consisting of:

- **14 independent microservices** (Python/FastAPI + Node.js)
- **React/TypeScript/Three.js/Mapbox digital twin** frontend
- **Full DevOps** stack (Kubernetes, Helm, GitHub Actions, KEDA)
- **Distributed infrastructure** (Kafka, Neo4j, TimescaleDB, Redis, Vault)

```
┌────────────────────────────────────────────────────────────────┐
│                        STRATUM PROTOCOL                        │
│                 Sovereign AI Infrastructure Layer              │
├────────────────────────────────────────────────────────────────┤
│  Frontend: React + Three.js + Mapbox (Digital Twin)            │
├────────────┬──────────────┬──────────────┬─────────────────────┤
│ Ingestion  │ Knowledge    │ State        │ Cascade Failure      │
│ Service    │ Graph Svc    │ Estimation   │ Engine               │
├────────────┼──────────────┼──────────────┼─────────────────────┤
│ Citizen    │ Policy Sim   │ Capital Opt  │ Decision Ledger      │
│ Behavior   │ Engine       │ Engine       │ Service              │
├────────────┼──────────────┼──────────────┼─────────────────────┤
│ Federated  │ Sovereign    │ Cyber        │ Orchestration        │
│ Learning   │ Governance   │ Defense      │ Engine               │
├────────────┼──────────────┼──────────────┼─────────────────────┤
│ Urban Evo  │ WebSocket    │              │                      │
│ Simulator  │ Gateway      │              │                      │
├────────────┴──────────────┴──────────────┴─────────────────────┤
│  Kafka │ Neo4j │ PostgreSQL │ TimescaleDB │ Redis │ Vault       │
└────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

| Tool       | Version  |
|------------|----------|
| Docker     | ≥ 24.0   |
| Docker Compose | ≥ 2.20 |
| Node.js    | ≥ 20.x   |
| Python     | ≥ 3.11   |
| kubectl    | ≥ 1.28   |
| Helm       | ≥ 3.12   |

### Development (Full Stack via Docker Compose)

```bash
# 1. Clone and configure environment
cp .env.example .env
# Edit .env with your API keys (Mapbox, etc.)

# 2. Start infrastructure services
make infra-up

# 3. Start all microservices
make dev

# 4. Start frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

### Individual Service Development

```bash
# Start a specific service locally
cd services/knowledge-graph-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

---

## Project Structure

```
STRATUM PROTOCOL/
├── .github/workflows/          # CI/CD pipelines
├── docs/                       # Architecture, security, data-flow documentation
├── frontend/                   # React + TypeScript digital twin UI
├── infra/
│   ├── docker/                 # Dockerfiles per service
│   ├── helm/                   # Helm charts
│   ├── k8s/                    # Raw Kubernetes manifests
│   └── observability/          # Prometheus, Grafana, ELK configs
├── schemas/
│   ├── avro/                   # Kafka Avro schemas
│   ├── neo4j/                  # Graph schema (Cypher)
│   ├── openapi/                # OpenAPI 3.1 specs
│   ├── postgres/               # PostgreSQL migration SQLs
│   ├── proto/                  # gRPC Protobuf definitions
│   └── timescaledb/            # TimescaleDB hypertable schemas
└── services/
    ├── auth-service/
    ├── capital-optimization-engine/
    ├── cascade-failure-engine/
    ├── citizen-behavior-engine/
    ├── cyber-defense-engine/
    ├── data-ingestion-service/
    ├── decision-ledger-service/
    ├── federated-learning-service/
    ├── knowledge-graph-service/
    ├── orchestration-engine/
    ├── policy-simulation-engine/
    ├── sovereign-governance-layer/
    ├── state-estimation-engine/
    ├── urban-evolution-simulator/
    └── websocket-gateway/
```

---

## Service Ports (Development)

| Service                    | Port  |
|----------------------------|-------|
| data-ingestion-service     | 8001  |
| knowledge-graph-service    | 8002  |
| state-estimation-engine    | 8003  |
| cascade-failure-engine     | 8004  |
| citizen-behavior-engine    | 8005  |
| policy-simulation-engine   | 8006  |
| capital-optimization-engine| 8007  |
| decision-ledger-service    | 8008  |
| federated-learning-service | 8009  |
| sovereign-governance-layer | 8010  |
| cyber-defense-engine       | 8011  |
| orchestration-engine       | 8012  |
| urban-evolution-simulator  | 8013  |
| auth-service               | 8000  |
| websocket-gateway          | 9000  |
| Frontend                   | 5173  |

---

## Technology Stack

| Category        | Technologies                                          |
|-----------------|-------------------------------------------------------|
| Backend         | Python 3.11, FastAPI, Pydantic v2, gRPC               |
| AI/ML           | PyTorch (ROCm), PyTorch Geometric, Ray RLlib, ONNX   |
| Federated       | Flower (flwr), Differential Privacy                   |
| Graph           | Neo4j Enterprise, PyNeo4j                             |
| Streaming       | Apache Kafka, Kafka Streams                           |
| Databases       | PostgreSQL 15, TimescaleDB 2.x, Redis 7               |
| Security        | HashiCorp Vault, mTLS (Istio), JWT + OAuth2           |
| Frontend        | React 18, TypeScript, Three.js, Mapbox GL, TailwindCSS|
| DevOps          | Docker, Kubernetes 1.28, Helm 3, GitHub Actions       |
| Autoscaling     | KEDA (Kafka-driven event-based autoscaling)           |
| Observability   | Prometheus, Grafana, ELK Stack, Jaeger (tracing)      |

---

## Deployment to Production

```bash
# Build and push Docker images
make docker-build
make docker-push REGISTRY=your.registry.io/stratum

# Deploy to Kubernetes
helm upgrade --install stratum-protocol infra/helm/stratum-protocol/ \
  --namespace stratum-system \
  --create-namespace \
  -f infra/helm/stratum-protocol/values-prod.yaml

# Verify deployment
kubectl get pods -n stratum-system
```

---

## Security Model

- **Zero-Trust Service Mesh** via Istio with mTLS between all services
- **JWT + OAuth2** for all external API access
- **HashiCorp Vault** for secrets management (no plaintext secrets in configs)
- **RBAC** with roles: `OPERATOR`, `ANALYST`, `GOVERNOR`, `ADMIN`, `AUDITOR`
- **Immutable audit trail** with cryptographic Merkle-tree verification
- **Differential Privacy** in federated learning (ε=0.1, δ=1e-5)

See `docs/security/security-model.md` for full threat model.

---

## License

STRATUM PROTOCOL is sovereign-grade software. All rights reserved.
Built for national-scale deployment, climate crisis response, and government audit.
