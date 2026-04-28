# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- Always respond in Traditional Chinese (繁體中文).
- Always write Git Commit Message in English.
- Do not read or modify `.env*` files unless explicitly requested.
- Always prefer Edit over Write for existing files.
- Always use forward slashes in file paths, not backslashes.
- When running /opsx:apply or any OpenSpec-related task, mark each task as completed immediately after finishing it.
- When in Plan Mode and you have finished presenting a complete plan (all questions answered, approach finalized), ask the user: "是否要使用 /opsx:new 建立 spec 進行實作？" If the user agrees, switch to `claude-sonnet-4-6` model first, then run `/opsx:new`.

## Project Overview

**PinFlow** — Kanban + Pin board desktop app. Three sub-projects in one repo:

| Layer    | Path        | Tech                                                                  |
| -------- | ----------- | --------------------------------------------------------------------- |
| Backend  | `backend/`  | Go, Gin, file-based JSON storage, Swagger                             |
| Frontend | `frontend/` | React 19, Vite, Tailwind v3, TanStack Query+Router, Zustand, @dnd-kit |
| Electron | `electron/` | Wraps frontend SPA + spawns Go backend, NSIS Windows target           |

`openspec/` — spec-driven development files (specs/, changes/, config.yaml)

## Commands

### Backend (Go module root is `backend/`, NOT repo root)

```bash
cd backend && go run . --workspace ../../pinflow-workspace  # dev server on :34115
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
cd frontend && pnpm lint                # ESLint
cd frontend && pnpm format              # Prettier
cd frontend && pnpm test -- --run src/pages/board-detail/components/cards/CardItem.test.tsx
```

### Electron / Make

```bash
make dev                                # start backend + frontend + electron (-j3 parallel)
make backend / make frontend / make electron   # individually
cd electron && npm start                # runs Electron directly (requires built frontend)
```

## Architecture

### Storage

Data is stored as JSON files in a **workspace directory** (Bruno-style, no database):

```
pinflow-workspace/
  manifest.json          # Version + global ID counters
  settings.json          # User settings (theme, locale)
  boards/
    board-N/
      board.json         # Board metadata
      manifest.json      # Per-board ID counters (tag, dependency)
      columns.json       # All columns for this board
      tags.json          # Per-board tags
      dependencies.json  # Per-board card dependencies
      cards/
        card-N.json      # Card with tag_ids + embedded checklists + comments
```

- `--workspace` flag sets the workspace path (default `./pinflow-workspace`)
- In-memory store with write-through to JSON files (`backend/store/`)
- Workspace is Git-syncable for multi-device portability

### Backend Layers

```
store/      → FileStore: in-memory data + JSON file persistence
model/      → Data structs (Board, Column, Card, Tag, Checklist, ChecklistItem, Comment, Dependency, Image)
repository/ → Repositories container (repository.go) + file-based implementations
service/    → Services container (service.go) + business logic; auto-pin logic lives here
dto/        → Request/Response types for JSON binding
api/        → Handlers container (handler.go) + Gin handlers + router.go
seed/       → Embedded example workspace JSON; seeds on first launch if no boards exist
tests/      → All tests (repository, service, handler layers)
```

Import paths use module name `pinflow`. Gin v1.12.0 requires go 1.25+.

**Key decisions:** Auto-pin: `CardService.MoveCard` and `CreateCard` check `Column.AutoPin`. FileStore uses `sync.RWMutex`.

### Frontend Architecture

```
src/
  pages/
    board-list/     → BoardListPage
    board-detail/   → BoardPage + components/
      components/
        cards/      → Card items, card detail dialog
        columns/    → Column components
        checklists/ → Checklist + cross-checklist DnD
        comments/   → Card comments
        graph/      → Dependency graph (@xyflow/react + dagre layout)
    pin/            → PinWindow + PinnedCardItem/PinOverlay
  hooks/
    queryKeys.ts    → All query keys (single source of truth)
    <domain>/queries/   → One query hook per file
    <domain>/mutations/ → One mutation hook per domain
    board/useBoardDnd.ts → DnD logic with optimistic cache updates
  stores/           → Zustand: themeStore, pinStore
  lib/api/          → Axios calls split by domain (re-exported via index.ts)
  routes/           → TanStack Router file-based; routeTree.gen.ts auto-generated
  types/            → TypeScript interfaces matching backend DTOs
```

API domains: `boards` `cards` `columns` `tags` `checklists` `comments` `dependencies` `images`

**Import convention:**

- 同一資料夾內互相引用 → `./`；跨目錄 → 一律用 `@/` alias
- MUST NOT 在任何前端檔案使用 `../` 或 `../../` 跨目錄 import

**Key decisions:**

- Tailwind v3 (not v4) — required for shadcn/ui compatibility
- `vitest.config.ts` is separate from `vite.config.ts`
- DnD: `PointerSensor` with `activationConstraint: { distance: 5 }`
- Electron: `window.electronAPI` injected by preload; API base → `http://localhost:34115/api/v1`
- Pin window: web = `PinOverlay` div; Electron = `BrowserWindow` with `alwaysOnTop: true`
- Graph view: @xyflow/react + dagre layout; lives in `board-detail/components/graph/`

### API Route Map

```
GET  /api/health
/api/v1/boards                          → CRUD
/api/v1/boards/:id/columns              → POST
/api/v1/boards/:id/dependencies         → GET
/api/v1/boards/:id/images/:filename     → GET
/api/v1/columns/:id                     → PATCH, DELETE
/api/v1/columns/:id/cards               → POST
/api/v1/cards/pinned                    → GET (must be before /:id)
/api/v1/cards/search                    → GET
/api/v1/cards/:id                       → GET, PATCH, DELETE
/api/v1/cards/:id/move                  → PATCH
/api/v1/cards/:id/pin                   → PATCH
/api/v1/cards/:id/schedule              → PATCH
/api/v1/cards/:id/tags                  → POST, DELETE /:tagId
/api/v1/cards/:id/duplicate             → POST
/api/v1/cards/:id/checklists            → GET, POST
/api/v1/cards/:id/dependencies          → GET, POST
/api/v1/cards/:id/comments              → POST
/api/v1/cards/:id/images                → POST
/api/v1/dependencies/:id                → DELETE
/api/v1/tags                            → GET, POST
/api/v1/tags/:id                        → PATCH, DELETE
/api/v1/checklists/:id                  → PATCH, DELETE
/api/v1/checklists/:id/items            → POST, PUT (sync)
/api/v1/checklist-items/:id             → PATCH, DELETE
/api/v1/checklist-items/:id/move        → PATCH
/api/v1/comments/:id                    → PATCH, DELETE
```

### Adding a New Endpoint

1. Add service interface method + implementation
2. Add handler with Swagger godoc, register in `api/router.go`
3. Run `swag init` in `backend/`
4. Add API call to `frontend/src/lib/api/<domain>.ts` (re-exported via `index.ts`)
5. Add query/mutation hook in `hooks/<domain>/queries/` or `mutations/`

## Development Workflow

```bash
# Quickstart: make dev  (backend + frontend + electron in parallel)
# Terminal 1: cd backend && go run . --workspace ../../pinflow-workspace
# Terminal 2: cd frontend && pnpm dev  →  http://localhost:5173
```

Go tools (`swag`, `golangci-lint`) are already on PATH.
