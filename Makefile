-include .env
export PINFLOW_SUPABASE_URL
export PINFLOW_SUPABASE_ANON_KEY

TEST_DB_CONTAINER ?= pinflow-test-db
TEST_DB_IMAGE ?= postgres:17-alpine
TEST_DB_PORT ?= 5433
TEST_DB_NAME ?= pinflow_test
TEST_DB_USER ?= test_user
TEST_DB_PASSWORD ?= test_pass

.PHONY: backend frontend electron dev package test-db-up test-db-down test-db-logs test-db-status test-migration test-backend test-all

# --- Backend ---
backend:
	cd backend && go run . --workspace ../../pinflow-workspace

# --- Frontend ---
frontend:
	cd frontend && pnpm dev

# --- Electron ---
electron:
	pnpm electron:dev

# --- 全部一起跑（推薦）---
dev:
	@echo "Starting backend, frontend, electron..."
	@$(MAKE) -j3 backend frontend electron

# --- 打包 Windows 安裝檔 ---
package:
	pnpm electron:package

# --- PostgreSQL migration 測試 ---
test-db-up:
	@echo "Starting PostgreSQL migration test database on port $(TEST_DB_PORT)..."
	@docker run -d \
		--name $(TEST_DB_CONTAINER) \
		-e POSTGRES_DB=$(TEST_DB_NAME) \
		-e POSTGRES_USER=$(TEST_DB_USER) \
		-e POSTGRES_PASSWORD=$(TEST_DB_PASSWORD) \
		-p $(TEST_DB_PORT):5432 \
		$(TEST_DB_IMAGE) >NUL || docker start $(TEST_DB_CONTAINER) >NUL
	@echo "Waiting for PostgreSQL to be ready..."
	@powershell -NoProfile -ExecutionPolicy Bypass -Command \
		"$$deadline = (Get-Date).AddSeconds(30); \
		do { \
			docker exec $(TEST_DB_CONTAINER) pg_isready -U $(TEST_DB_USER) -d $(TEST_DB_NAME) *> $$null; \
			if ($$LASTEXITCODE -eq 0) { exit 0 }; \
			Start-Sleep -Seconds 1 \
		} while ((Get-Date) -lt $$deadline); \
		exit 1"
	@echo "PostgreSQL is ready at localhost:$(TEST_DB_PORT)"

test-db-down:
	@echo "Stopping PostgreSQL migration test database..."
	@docker rm -f $(TEST_DB_CONTAINER) >NUL 2>&1 || echo "Container not found"

test-db-logs:
	docker logs -f $(TEST_DB_CONTAINER)

test-db-status:
	@docker ps -a --filter name=$(TEST_DB_CONTAINER)

test-migration:
	@powershell -NoProfile -ExecutionPolicy Bypass \
		-File scripts/test-supabase-migration.ps1 \
		-Container $(TEST_DB_CONTAINER) \
		-Image $(TEST_DB_IMAGE) \
		-Port $(TEST_DB_PORT) \
		-Database $(TEST_DB_NAME) \
		-DatabaseUser $(TEST_DB_USER) \
		-DatabasePassword $(TEST_DB_PASSWORD)

test-backend:
	cd backend && go test -count=1 ./...

test-all: test-backend test-migration
