# STRATUM PROTOCOL — Start Commands

> Run each block in a **separate terminal tab**.  
> All paths are relative to the project root: `/Users/arnav/Desktop/Stratum-Protocol`

---

## 1 — Infrastructure (Docker — start this first)

```bash
# Starts Kafka, Neo4j, PostgreSQL, TimescaleDB, Redis, MinIO, Vault
cd /Users/arnav/Desktop/Stratum-Protocol
docker compose -f docker-compose.infra.yml up -d
```

```bash
# Starts all microservice containers (alternative to running them individually)
cd /Users/arnav/Desktop/Stratum-Protocol
docker compose up -d
```

---

## 2 — Frontend

```bash
cd /Users/arnav/Desktop/Stratum-Protocol/frontend
npm run dev
# → http://localhost:5173
```

---

## 3 — Python Services (run each in its own terminal)

> **One-time venv setup** (do this once per service, if `.venv` doesn't exist yet):
> ```bash
> cd services/<service-name>
> python3.11 -m venv .venv
> source .venv/bin/activate
> pip install -r requirements.txt
> ```
> `knowledge-graph-service` already has its `.venv` ready.

---

### auth-service — Port 8000
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/auth-service
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

### data-ingestion-service — Port 8001
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/data-ingestion-service
source .venv/bin/activate
uvicorn main:app --reload --port 8001
```

### knowledge-graph-service — Port 8002
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/knowledge-graph-service
source .venv/bin/activate
uvicorn main:app --reload --port 8002
```

### state-estimation-engine — Port 8003
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/state-estimation-engine
source .venv/bin/activate
uvicorn main:app --reload --port 8003
```

### cascade-failure-engine — Port 8004
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/cascade-failure-engine
source .venv/bin/activate
uvicorn main:app --reload --port 8004
```

### citizen-behavior-engine — Port 8005
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/citizen-behavior-engine
source .venv/bin/activate
uvicorn main:app --reload --port 8005
```

### policy-simulation-engine — Port 8006
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/policy-simulation-engine
source .venv/bin/activate
uvicorn main:app --reload --port 8006
```

### capital-optimization-engine — Port 8007
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/capital-optimization-engine
source .venv/bin/activate
uvicorn main:app --reload --port 8007
```

### decision-ledger-service — Port 8008
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/decision-ledger-service
source .venv/bin/activate
uvicorn main:app --reload --port 8008
```

### federated-learning-service — Port 8009
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/federated-learning-service
source .venv/bin/activate
uvicorn main:app --reload --port 8009
```

### sovereign-governance-layer — Port 8010
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/sovereign-governance-layer
source .venv/bin/activate
uvicorn main:app --reload --port 8010
```

### cyber-defense-engine — Port 8011
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/cyber-defense-engine
source .venv/bin/activate
uvicorn main:app --reload --port 8011
```

### orchestration-engine — Port 8012
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/orchestration-engine
source .venv/bin/activate
uvicorn main:app --reload --port 8012
```

### urban-evolution-simulator — Port 8013
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/urban-evolution-simulator
source .venv/bin/activate
uvicorn main:app --reload --port 8013
```

### websocket-gateway — Port 9000
```bash
cd /Users/arnav/Desktop/Stratum-Protocol/services/websocket-gateway
source .venv/bin/activate
uvicorn main:app --reload --port 9000
```

---

## Port Reference

| Service                     | Port |
|-----------------------------|------|
| auth-service                | 8000 |
| data-ingestion-service      | 8001 |
| knowledge-graph-service     | 8002 |
| state-estimation-engine     | 8003 |
| cascade-failure-engine      | 8004 |
| citizen-behavior-engine     | 8005 |
| policy-simulation-engine    | 8006 |
| capital-optimization-engine | 8007 |
| decision-ledger-service     | 8008 |
| federated-learning-service  | 8009 |
| sovereign-governance-layer  | 8010 |
| cyber-defense-engine        | 8011 |
| orchestration-engine        | 8012 |
| urban-evolution-simulator   | 8013 |
| websocket-gateway           | 9000 |
| Frontend                    | 5173 |
