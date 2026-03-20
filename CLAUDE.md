# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **語言規則（Language Rules）**
> - 一律用**繁體中文**回答問題
> - Git commit message 一律使用**英文**

---

## Project Overview

**PinFlow** — Kanban + Pin board desktop app. Three sub-projects in one repo:

| Layer | Path | Tech |
|---|---|---|
| Backend | `backend/` | Go, Gin, GORM, SQLite (pure-Go), Swagger |
| Frontend | `frontend/` | React 19, Vite, Tailwind v3, TanStack Query+Router, Zustand, @dnd-kit |
| Electron | `electron/` | Wraps frontend SPA + spawns Go backend, NSIS Windows target |

---

## Commands

### Backend (Go module root is `backend/`, NOT repo root)
```bash
cd backend && go run .                  # dev server on :34115
cd backend && go build ./...            # compile check
cd backend && go test ./... -v          # all tests
cd backend && go test ./tests/... -run TestFoo -v  # single test
cd backend && swag init                 # regenerate Swagger docs (run after handler changes)
```

### Frontend
```bash
cd frontend && pnpm dev                 # dev server on :5173 (proxies /api → :34115)
cd frontend && pnpm build               # production build → frontend/dist/
cd frontend && pnpm test                # vitest
cd frontend && pnpm test -- --run src/features/board/CardItem.test.tsx  # single file
```

### Electron
```bash
cd electron && npm start                # runs Electron (requires built frontend + backend running)
```

---

## Architecture

### Backend Layers
```
model/      → GORM structs (Board, Column, Card, Tag, Checklist, ChecklistItem)
repository/ → GORM queries (interfaces + implementations)
service/    → Business logic (interfaces + implementations); auto-pin logic lives here
dto/        → Request/Response types for JSON binding
api/        → Gin handlers + router.go
docs/       → Swagger auto-generated (do not edit manually)
tests/      → All tests (repository, service, handler layers)
```

Import paths use module name `pinflow` (e.g. `pinflow/service`, `pinflow/repository`).

**Key backend decisions:**
- SQLite DSN must include `?_pragma=foreign_keys(1)` for cascade deletes
- `glebarez/sqlite` (pure-Go, no CGO) — no gcc required
- Gin v1.12.0 requires go 1.25+
- Auto-pin logic: `CardService.MoveCard` and `CreateCard` check `Column.AutoPin`
- Position ordering: float64 midpoint (`midPosition` util in `frontend/src/lib/utils.ts`)

### Frontend Architecture
```
src/
  features/board/   → BoardPage, CardItem, ColumnHeader, AddCardForm (main Kanban UI)
  features/card/    → CardDetailDialog (full card detail with tags, checklists, schedule)
  hooks/            → TanStack Query hooks (useBoards, useCards, useColumns, useTags, useChecklists)
  stores/           → Zustand: themeStore (dark/light), pinStore
  lib/api.ts        → All axios API calls (single source of truth for endpoints)
  lib/utils.ts      → cn(), midPosition()
  routes/           → TanStack Router file-based; routeTree.gen.ts is manually maintained
  types/            → TypeScript interfaces matching backend DTOs
```

**Key frontend decisions:**
- Tailwind v3 (not v4) — required for shadcn/ui compatibility
- `vitest.config.ts` is separate from `vite.config.ts` (vite build chokes on `test` key)
- DnD: `PointerSensor` with `activationConstraint: { distance: 5 }` — pointer moves < 5px = click, ≥ 5px = drag
- `usePinnedCards` polls every 3 seconds (`refetchInterval: 3000`)
- In Electron mode, `window.electronAPI` is injected by preload; API base URL switches to `http://localhost:34115/api/v1`
- Pin window: web mode = `PinOverlay` floating div; Electron mode = separate `BrowserWindow` with `alwaysOnTop: true`

### API Route Map
```
GET    /api/health
GET    /swagger/*any

/api/v1/boards          → CRUD
/api/v1/boards/:id/columns  → POST (create column)
/api/v1/columns/:id     → PATCH, DELETE
/api/v1/columns/:id/cards   → POST (create card)
/api/v1/cards/pinned    → GET (must be before /:id)
/api/v1/cards/:id       → GET, PATCH, DELETE
/api/v1/cards/:id/move  → PATCH
/api/v1/cards/:id/pin   → PATCH
/api/v1/cards/:id/tags  → POST, DELETE /:tagId
/api/v1/cards/:id/checklists → GET, POST
/api/v1/tags            → GET, POST
/api/v1/checklists/:id  → DELETE
/api/v1/checklists/:id/items → POST
/api/v1/checklist-items/:id  → PATCH, DELETE
```

### Adding a New Backend Endpoint (Checklist)
1. Add method to service interface in `service/card_service.go`
2. Implement on `cardService` struct
3. Add handler to `api/card_handler.go` with Swagger godoc
4. Register route in `api/router.go`
5. Run `swag init` in `backend/`
6. Add API call to `frontend/src/lib/api.ts`
7. Add TanStack Query hook to relevant `frontend/src/hooks/use*.ts`

---

## Development Workflow

**Full local dev:**
```bash
# Terminal 1
cd backend && go run .

# Terminal 2
cd frontend && pnpm dev
# → open http://localhost:5173
```

**Shell note:** Go tools (`wails`, `swag`, `golangci-lint`) are already on PATH — do not prefix commands with `export PATH=...`.
