## Why

Tags 與 Dependencies 目前以 workspace 全域方式儲存（`tags.json`、`dependencies.json` 在 workspace 根目錄），導致卡片可以掛上其他 board 的 tag，也可以建立跨 board 的 dependency，破壞 board 的資料隔離性。

## What Changes

- Tags 改為 per-board 儲存（`boards/board-N/tags.json`），每個 board 擁有獨立的 tag 命名空間
- Dependencies 改為 per-board 儲存（`boards/board-N/dependencies.json`），只允許同一 board 內的卡片互建 dependency
- 新增 per-board ID 計數器（`boards/board-N/manifest.json`），tag 與 dependency ID 在 board 內自增
- **BREAKING**: 移除 `GET /api/v1/tags` 與 `POST /api/v1/tags`，改為 `GET /api/v1/boards/:id/tags` 與 `POST /api/v1/boards/:id/tags`
- `GET /api/v1/cards/search` 新增可選 `?board_id=` 過濾，讓 dependency 目標搜尋只列同 board 卡片
- Service 層新增跨 board 驗證：attach tag 或 create dependency 時若 board 不同則回 422
- Snapshot 服務同步更新，改從 per-board 檔案 copy / restore tags 與 dependencies
- 前端 tag picker 改為只顯示當前 board 的 tags；dependency 目標搜尋加入 board 過濾

## Capabilities

### New Capabilities

（無新 capability，皆為既有功能的行為約束強化）

### Modified Capabilities

- `card-tags`：Tags 從 workspace 全域資源改為 board 範圍資源；同名 tag 可在不同 board 獨立存在；跨 board attach tag 須回錯誤
- `card-dependencies`：Dependencies 從允許跨 board 改為只允許同 board 內的卡片；跨 board create dependency 須回錯誤

## Impact

- **Backend**：`backend/model/tag.go`、`backend/model/dependency.go`（新增 BoardID 欄位）；`backend/store/store.go`（最大改動）；`backend/repository/`、`backend/service/`、`backend/api/tag_handler.go`、`backend/api/dependency_handler.go`、`backend/api/router.go`、`backend/service/snapshot_service.go`
- **Frontend**：`frontend/src/lib/api/tags.ts`、`frontend/src/hooks/tag/`、`frontend/src/hooks/dependency/queries/useCardSearch.ts`、`frontend/src/pages/board-detail/components/cards/TagsPopover.tsx`、dependency graph 新增 UI
- **Storage**：workspace 佈局新增 `boards/board-N/tags.json`、`boards/board-N/dependencies.json`、`boards/board-N/manifest.json`；移除 workspace 根目錄的 `tags.json`、`dependencies.json`
- **API 破壞性變更**：`GET/POST /api/v1/tags` 路由移除；需更新 Swagger 文件
