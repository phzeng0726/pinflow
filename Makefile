# 預設 shell（Windows 用 Git Bash / WSL 會比較穩）
SHELL := /bin/bash

.PHONY: backend frontend electron dev

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