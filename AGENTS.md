# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Rules

- Always respond in Traditional Chinese (繁體中文).
- Always write Git Commit Messages in English.
- Do not read or modify `.env*` files unless explicitly requested.
- Always use `apply_patch` to edit existing files.
- Always use forward slashes in file paths, not backslashes.
- When applying or performing any OpenSpec-related task, mark each task as completed immediately after finishing it.
- When in Plan Mode and you have finished presenting a complete plan (all questions answered and the approach finalized), ask the user: "是否要使用 OpenSpec 建立 spec 進行實作？" If the user agrees, use the `openspec-new-change` workflow.

## Project Overview

**PinFlow** — Kanban + Pin board desktop app. Three sub-projects in one repo:

| Layer    | Path        | Tech                                                                  |
| -------- | ----------- | --------------------------------------------------------------------- |
| Backend  | `backend/`  | Go, Gin, file-based JSON storage, Swagger                             |
| Frontend | `frontend/` | React 19, Vite, Tailwind v3, TanStack Query+Router, Zustand, @dnd-kit |
| Electron | `electron/` | Wraps frontend SPA + spawns Go backend, NSIS Windows target           |

`openspec/` — spec-driven development files (`specs/`, `changes/`, `config.yaml`).

## Commands

### Backend

The Go module root is `backend/`, not the repository root.

```bash
cd backend && go run . --workspace ../../pinflow-workspace
cd backend && go build ./...
cd backend && go test ./... -v
cd backend && go test ./tests/... -run TestFoo -v
cd backend && swag init
```

The development server runs on port `34115`. Regenerate Swagger docs with `swag init` after handler changes.

### Frontend

```bash
cd frontend && pnpm dev
cd frontend && pnpm build
cd frontend && pnpm test
cd frontend && pnpm lint
cd frontend && pnpm format
cd frontend && pnpm test -- --run src/pages/board-detail/components/cards/CardItem.test.tsx
```

The development server runs on port `5173` and proxies `/api` to port `34115`. Production output is written to `frontend/dist/`.

### Electron / Make

```bash
make dev
make backend
make frontend
make electron
cd electron && npm start
```

`make dev` starts the backend, frontend, and Electron in parallel. Running Electron directly requires a built frontend.

## Architecture

### Storage

Data is stored as JSON files in a workspace directory (Bruno-style, no database):

```text
pinflow-workspace/
  manifest.json
  settings.json
  boards/
    board-N/
      board.json
      manifest.json
      columns.json
      tags.json
      dependencies.json
      cards/
        card-N.json
```

- `manifest.json`: version and global ID counters.
- `settings.json`: user settings such as theme and locale.
- `board.json`: board metadata.
- Per-board `manifest.json`: tag and dependency ID counters.
- `columns.json`: all columns for a board.
- `tags.json`: per-board tags.
- `dependencies.json`: per-board card dependencies.
- Each `card-N.json`: card data with `tag_ids`, embedded checklists, and comments.
- The `--workspace` flag sets the workspace path; the default is `./pinflow-workspace`.
- `backend/store/` maintains an in-memory store with write-through JSON persistence.
- Workspaces are Git-syncable for multi-device portability.

### Backend Layers

```text
store/       FileStore: in-memory data and JSON persistence
model/       Data structs
repository/  Repository container and file-based implementations
service/     Service container and business logic
dto/         Request and response types for JSON binding
api/         Handler container, Gin handlers, and router
seed/        Embedded example workspace JSON
tests/       Repository, service, and handler tests
```

Model types include Board, Column, Card, Tag, Checklist, ChecklistItem, Comment, Dependency, and Image.

Import paths use module name `pinflow`. Gin v1.12.0 requires Go 1.25 or newer.

Key decisions:

- Auto-pin logic is in `CardService.MoveCard` and `CardService.CreateCard`, which check `Column.AutoPin`.
- `FileStore` uses `sync.RWMutex`.
- Example workspace data is seeded on first launch when no boards exist.

### Frontend Architecture

```text
src/
  pages/
    board-list/     BoardListPage
    board-detail/   BoardPage and components/
      components/
        cards/      Card items and card detail dialog
        columns/    Column components
        checklists/ Checklist and cross-checklist DnD
        comments/   Card comments
        graph/      Dependency graph
        timeline/   Gantt-style timeline view
        snapshots/  Snapshot create and restore dialogs
    pin/            PinWindow, PinnedCardItem, and PinOverlay
  hooks/
    queryKeys.ts    Single source of truth for query keys
    <domain>/queries/
    <domain>/mutations/
    board/useBoardDnd.ts
  stores/
  lib/api/
  locales/
  routes/
  types/
```

- Query hooks use one hook per file.
- Mutation hooks use one hook per domain.
- `board/useBoardDnd.ts` contains DnD logic with optimistic cache updates.
- Zustand stores include `themeStore`, `pinStore`, `localeStore`, `timelineStore`, and `graphViewStore`.
- Axios API calls are split by domain in `lib/api/` and re-exported through `index.ts`.
- Locales are stored in `en-US.json` and `zh-TW.json`.
- TanStack Router uses file-based routes; `routeTree.gen.ts` is generated.
- TypeScript interfaces in `types/` match backend DTOs.

API domains: `boards`, `cards`, `columns`, `tags`, `checklists`, `comments`, `dependencies`, `images`, and `snapshots`.

Import conventions:

- Use `./` for imports within the same directory.
- Use the `@/` alias for cross-directory imports.
- Do not use `../` or `../../` for cross-directory imports in any frontend file.

Key decisions:

- Use Tailwind v3, not v4, for shadcn/ui compatibility.
- `vitest.config.ts` is separate from `vite.config.ts`.
- DnD uses `PointerSensor` with `activationConstraint: { distance: 5 }`.
- Electron injects `window.electronAPI` through preload.
- The API base is `http://localhost:34115/api/v1`.
- The web pin window uses a `PinOverlay` div; Electron uses `BrowserWindow` with `alwaysOnTop: true`.
- The graph view uses `@xyflow/react` with dagre layout and lives in `board-detail/components/graph/`.

### API Route Map

```text
GET  /api/health
/api/v1/boards                             CRUD
/api/v1/boards/:id/columns                 POST
/api/v1/boards/:id/dependencies            GET
/api/v1/boards/:id/images/:filename        GET
/api/v1/boards/:id/snapshots               GET, POST
/api/v1/boards/:id/snapshots/:sid/restore  POST
/api/v1/boards/:id/snapshots/:sid          DELETE
/api/v1/columns/:id                        PATCH, DELETE
/api/v1/columns/:id/cards                  POST
/api/v1/cards/pinned                       GET (must be before /:id)
/api/v1/cards/search                       GET
/api/v1/cards/:id                          GET, PATCH, DELETE
/api/v1/cards/:id/move                     PATCH
/api/v1/cards/:id/pin                      PATCH
/api/v1/cards/:id/schedule                 PATCH
/api/v1/cards/:id/tags                     POST, DELETE /:tagId
/api/v1/cards/:id/duplicate                POST
/api/v1/cards/:id/checklists               GET, POST
/api/v1/cards/:id/dependencies             GET, POST
/api/v1/cards/:id/comments                 POST
/api/v1/cards/:id/images                   POST
/api/v1/dependencies/:id                   DELETE
/api/v1/tags                               GET, POST
/api/v1/tags/:id                           PATCH, DELETE
/api/v1/checklists/:id                     PATCH, DELETE
/api/v1/checklists/:id/items               POST, PUT (sync)
/api/v1/checklist-items/:id                PATCH, DELETE
/api/v1/checklist-items/:id/move           PATCH
/api/v1/comments/:id                       PATCH, DELETE
```

### Adding a New Endpoint

1. Add the service interface method and implementation.
2. Add the handler with Swagger godoc and register it in `api/router.go`.
3. Run `swag init` in `backend/`.
4. Add the API call to `frontend/src/lib/api/<domain>.ts` and re-export it through `index.ts`.
5. Add a query or mutation hook in `hooks/<domain>/queries/` or `hooks/<domain>/mutations/`.

## Development Workflow

Quickstart:

```bash
make dev
```

Run services separately:

```bash
# Terminal 1
cd backend && go run . --workspace ../../pinflow-workspace

# Terminal 2
cd frontend && pnpm dev
```

Go tools such as `swag` and `golangci-lint` are already on `PATH`.
