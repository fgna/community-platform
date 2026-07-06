.PHONY: dev test lint typecheck build docker-local docker-prod migrate seed-demo smoke help

## ── Local development ────────────────────────────────────────────────────────

dev: ## Start infrastructure (postgres + redis) then run API + web with hot reload
	docker compose up postgres redis -d
	pnpm dev

## ── Quality checks ───────────────────────────────────────────────────────────

test: ## Run all unit tests
	pnpm test

lint: ## Lint all workspaces
	pnpm lint

typecheck: ## TypeScript type check (no emit)
	pnpm typecheck

build: ## Build all workspaces
	pnpm build

## ── Docker ───────────────────────────────────────────────────────────────────

docker-local: ## Build and start all services (dev mode — ports exposed on host)
	docker compose up --build -d

docker-prod: ## Build and start in production mode (nginx proxy, no host port exposure)
	docker compose -f docker-compose.yml --profile proxy up --build -d

## ── Database ─────────────────────────────────────────────────────────────────

migrate: ## Apply pending database migrations (safe for production)
	docker compose exec api npx prisma migrate deploy

seed-demo: ## Seed demo accounts and sample content (local/dev only — NOT for production)
	docker compose exec -e SEED_DEMO_DATA=true api npx prisma db seed

## ── Smoke test ───────────────────────────────────────────────────────────────

smoke: ## Run smoke tests against a running instance (set API_URL and WEB_URL if needed)
	./scripts/smoke-test.sh

## ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
