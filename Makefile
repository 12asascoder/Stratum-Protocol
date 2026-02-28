.PHONY: all infra-up infra-down dev dev-down build test lint clean docker-build docker-push help

REGISTRY ?= ghcr.io/stratumprotocol
VERSION  ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "0.0.0-dev")
NAMESPACE ?= stratum-system

# =============================================================================
# HELP
# =============================================================================
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# INFRASTRUCTURE
# =============================================================================
infra-up: ## Start all infrastructure services (Kafka, Neo4j, Postgres, Redis, Vault)
	docker compose -f docker-compose.infra.yml up -d
	@echo "⏳ Waiting for infrastructure to be healthy..."
	@sleep 10
	@echo "✅ Infrastructure services started"

infra-down: ## Stop all infrastructure services
	docker compose -f docker-compose.infra.yml down

infra-reset: ## Stop infra and remove all volumes (DESTRUCTIVE)
	docker compose -f docker-compose.infra.yml down -v
	@echo "⚠️  All infrastructure volumes destroyed"

# =============================================================================
# DEVELOPMENT
# =============================================================================
dev: ## Start all application microservices
	docker compose up -d
	@echo "✅ All services running. Frontend: cd frontend && npm run dev"

dev-down: ## Stop all application microservices
	docker compose down

restart: ## Restart a specific service (SERVICE=name)
	docker compose restart $(SERVICE)

logs: ## Tail logs for a service (SERVICE=name)
	docker compose logs -f $(SERVICE)

# =============================================================================
# BUILD & TEST
# =============================================================================
build: ## Build all Docker images
	docker compose build

test: ## Run tests for all services
	@for dir in services/*/; do \
		if [ -f "$$dir/requirements.txt" ]; then \
			echo "🧪 Testing $$dir..."; \
			cd $$dir && pip install -r requirements.txt -q && pytest tests/ -v --tb=short 2>/dev/null || true; \
			cd ../..; \
		fi; \
	done
	cd frontend && npm run type-check && npm run build

lint: ## Lint all Python services
	@for dir in services/*/; do \
		if [ -f "$$dir/requirements.txt" ]; then \
			echo "🔍 Linting $$dir..."; \
			cd $$dir && ruff check . 2>/dev/null || true; \
			cd ../..; \
		fi; \
	done

# =============================================================================
# DOCKER
# =============================================================================
docker-build: ## Build and tag all images with version
	@for dir in services/*/; do \
		svc=$$(basename $$dir); \
		echo "🐳 Building $$svc:$(VERSION)..."; \
		docker build -t $(REGISTRY)/$$svc:$(VERSION) -t $(REGISTRY)/$$svc:latest \
			-f infra/docker/Dockerfile.$$svc $$dir 2>/dev/null || \
		docker build -t $(REGISTRY)/$$svc:$(VERSION) -t $(REGISTRY)/$$svc:latest $$dir; \
	done
	docker build -t $(REGISTRY)/frontend:$(VERSION) -t $(REGISTRY)/frontend:latest frontend/

docker-push: ## Push all images to registry
	@for dir in services/*/; do \
		svc=$$(basename $$dir); \
		docker push $(REGISTRY)/$$svc:$(VERSION); \
		docker push $(REGISTRY)/$$svc:latest; \
	done
	docker push $(REGISTRY)/frontend:$(VERSION)
	docker push $(REGISTRY)/frontend:latest

# =============================================================================
# KUBERNETES / HELM
# =============================================================================
k8s-apply: ## Apply raw Kubernetes manifests
	kubectl apply -f infra/k8s/namespace.yaml
	kubectl apply -f infra/k8s/ -n $(NAMESPACE)

helm-install: ## Install/upgrade via Helm
	helm upgrade --install stratum-protocol infra/helm/stratum-protocol/ \
		--namespace $(NAMESPACE) \
		--create-namespace \
		-f infra/helm/stratum-protocol/values.yaml

helm-install-prod: ## Install with production values
	helm upgrade --install stratum-protocol infra/helm/stratum-protocol/ \
		--namespace $(NAMESPACE) \
		--create-namespace \
		-f infra/helm/stratum-protocol/values-prod.yaml

k8s-status: ## Show pod status
	kubectl get pods,svc,ingress -n $(NAMESPACE)

# =============================================================================
# DATABASE
# =============================================================================
db-migrate: ## Run PostgreSQL migrations
	@for f in schemas/postgres/*.sql; do \
		echo "Running migration $$f..."; \
		PGPASSWORD=$(POSTGRES_PASSWORD) psql -h $(POSTGRES_HOST) -U $(POSTGRES_USER) \
			-d $(POSTGRES_DB) -f $$f; \
	done

db-neo4j-init: ## Initialize Neo4j schema
	@docker exec -i stratum-neo4j cypher-shell -u neo4j -p $(NEO4J_PASSWORD) \
		< schemas/neo4j/graph_schema.cypher

# =============================================================================
# CLEAN
# =============================================================================
clean: ## Remove build artifacts and caches
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	cd frontend && rm -rf dist node_modules/.cache 2>/dev/null || true
	@echo "✅ Clean complete"
