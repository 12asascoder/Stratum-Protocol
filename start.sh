#!/usr/bin/env bash
# =============================================================================
# STRATUM PROTOCOL — Full Stack Startup Script
# =============================================================================
# Usage:  ./start.sh              (start everything)
#         ./start.sh --infra-only (infra + skip services / frontend)
#         ./start.sh --skip-infra (services + frontend only, infra already up)
#         ./start.sh --frontend-only (npm dev only)
# =============================================================================

set -euo pipefail

# ─── Colours ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}${BOLD}[STRATUM]${RESET} $*"; }
success() { echo -e "${GREEN}${BOLD}[  OK   ]${RESET} $*"; }
warn()    { echo -e "${YELLOW}${BOLD}[ WARN  ]${RESET} $*"; }
error()   { echo -e "${RED}${BOLD}[ ERROR ]${RESET} $*"; exit 1; }

# ─── Root guard ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── Flags ──────────────────────────────────────────────────────────────────
INFRA_ONLY=false
SKIP_INFRA=false
FRONTEND_ONLY=false

for arg in "$@"; do
  case $arg in
    --infra-only)    INFRA_ONLY=true ;;
    --skip-infra)    SKIP_INFRA=true ;;
    --frontend-only) FRONTEND_ONLY=true ;;
    --help|-h)
      echo "Usage: $0 [--infra-only | --skip-infra | --frontend-only]"
      exit 0 ;;
    *) warn "Unknown flag: $arg. Ignored." ;;
  esac
done

# ─── Pre-flight checks ───────────────────────────────────────────────────────
info "Running pre-flight checks..."

command -v docker  &>/dev/null || error "Docker not found. Install Docker Desktop and try again."
docker info        &>/dev/null || error "Docker daemon is not running. Start Docker Desktop first."
command -v node    &>/dev/null || error "Node.js not found. Install Node.js (>=18) to run the frontend."
command -v npm     &>/dev/null || error "npm not found. Install Node.js (>=18) to run the frontend."

success "Pre-flight checks passed."

# ─── Helper: wait for a container to be healthy ───────────────────────────
wait_healthy() {
  local name=$1 max=${2:-60} elapsed=0
  info "Waiting for ${name} to be healthy..."
  until [ "$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null)" = "healthy" ]; do
    sleep 3; elapsed=$((elapsed + 3))
    if [ $elapsed -ge $max ]; then
      warn "${name} did not become healthy within ${max}s — continuing anyway."
      return
    fi
  done
  success "${name} is healthy."
}

# ─── 1. Infrastructure ───────────────────────────────────────────────────────
if [ "$FRONTEND_ONLY" = false ] && [ "$SKIP_INFRA" = false ]; then
  info "Starting infrastructure services (Kafka, Postgres, Neo4j, Redis, Vault, etc.)..."
  docker compose -f docker-compose.infra.yml up -d

  # Wait on the most critical services before booting the app layer
  wait_healthy stratum-postgres     90
  wait_healthy stratum-redis        60
  wait_healthy stratum-kafka        120
  wait_healthy stratum-elasticsearch 120

  success "Infrastructure is up."
fi

if [ "$INFRA_ONLY" = true ]; then
  echo ""
  info "Infrastructure-only mode — skipping application services and frontend."
  infra_summary
  exit 0
fi

# ─── 2. Application microservices ────────────────────────────────────────────
if [ "$FRONTEND_ONLY" = false ]; then
  info "Building and starting application microservices..."
  docker compose up -d --build

  success "All microservices started."
fi

# ─── 3. Frontend (Vite dev server) ───────────────────────────────────────────
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  info "Installing frontend dependencies (first run)..."
  npm install --prefix "$FRONTEND_DIR"
fi

info "Starting Vite dev server in background..."
npm run dev --prefix "$FRONTEND_DIR" &
FRONTEND_PID=$!

# Give Vite a moment to print its URL
sleep 3

# ─── Cleanup on Ctrl-C ───────────────────────────────────────────────────────
cleanup() {
  echo ""
  warn "Shutting down frontend dev server (PID $FRONTEND_PID)..."
  kill "$FRONTEND_PID" 2>/dev/null || true
  warn "Microservices and infrastructure are still running."
  warn "To stop them run:  docker compose down && docker compose -f docker-compose.infra.yml down"
}
trap cleanup INT TERM

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${GREEN}  STRATUM PROTOCOL — All Systems Online${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${BOLD}Frontend (Vite)${RESET}        →  http://localhost:5173"
echo ""
echo -e "  ${BOLD}Microservices${RESET}"
echo -e "    Auth Service           →  http://localhost:8000"
echo -e "    Data Ingestion         →  http://localhost:8001"
echo -e "    Knowledge Graph        →  http://localhost:8002"
echo -e "    State Estimation       →  http://localhost:8003"
echo -e "    Cascade Failure        →  http://localhost:8004"
echo -e "    Citizen Behavior       →  http://localhost:8005"
echo -e "    Policy Simulation      →  http://localhost:8006"
echo -e "    Capital Optimization   →  http://localhost:8007"
echo -e "    Decision Ledger        →  http://localhost:8008"
echo -e "    Federated Learning     →  http://localhost:8009"
echo -e "    Sovereign Governance   →  http://localhost:8010"
echo -e "    Cyber Defense          →  http://localhost:8011"
echo -e "    Orchestration          →  http://localhost:8012"
echo -e "    Urban Evolution        →  http://localhost:8013"
echo -e "    WebSocket Gateway      →  ws://localhost:9000"
echo ""
echo -e "  ${BOLD}Infrastructure${RESET}"
echo -e "    Kafka                  →  localhost:9092"
echo -e "    PostgreSQL             →  localhost:5432"
echo -e "    TimescaleDB            →  localhost:5433"
echo -e "    Neo4j Browser          →  http://localhost:7474"
echo -e "    Redis                  →  localhost:6379"
echo -e "    MinIO Console          →  http://localhost:9001"
echo -e "    Vault                  →  http://localhost:8200"
echo -e "    Prometheus             →  http://localhost:9090"
echo -e "    Grafana                →  http://localhost:3000"
echo -e "    Kibana                 →  http://localhost:5601"
echo ""
echo -e "  ${YELLOW}Press Ctrl-C to stop the frontend dev server.${RESET}"
echo -e "  ${YELLOW}Services/infra continue running until you run: make dev-down${RESET}"
echo ""

# Keep script alive so Ctrl-C works cleanly
wait "$FRONTEND_PID" 2>/dev/null || true
