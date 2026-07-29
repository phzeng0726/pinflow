## Why

PinFlow 目前使用純本地 file-based JSON 儲存，無法跨裝置同步或雲端備份。使用者換電腦時需要手動搬移 workspace 目錄，且沒有自動備份機制。加入 Supabase 作為雲端同步層，可在不破壞現有離線優先架構的前提下，實現跨裝置同步與自動備份。

## What Changes

- 新增 Supabase Auth 整合（Google 登入），作為可選功能——不登入仍可正常使用 app
- 新增 Push 同步：本地 JSON 檔案變更後自動上推至 Supabase（JSONB blob 方式儲存）
- 新增定期 reconciliation：登入且啟用同步時，每 3 分鐘執行全量同步，補足外部修改或通知遺漏
- 保留離線優先的 example board：無論是否登入，新 workspace 都照常建立範例資料
- 新增登入後資料來源選擇：帳號已有雲端資料時，由使用者選擇以雲端 workspace 取代本機，或以本機 workspace 取代雲端；決定前暫停自動同步
- 新增同步與帳號控制 UI（整合至 header action 區的 dropdown，提供狀態、最後同步時間、啟用／停用、手動同步及登出）
- Backend 新增 `sync` 套件（Go），透過 `net/http` 直接呼叫 Supabase REST API
- Electron 新增 OAuth 流程（系統瀏覽器 + localhost callback）與 token 加密持久化（`safeStorage`）
- Settings model 擴充 `syncEnabled` 欄位

## Capabilities

### New Capabilities

- `supabase-auth`: Supabase Auth 整合——Google OAuth 登入/登出、token 驗證與刷新、session 管理。涵蓋 backend auth 模組、Electron OAuth 流程、frontend auth store 與 UI
- `cloud-sync`: 雲端同步引擎——本地 JSON 檔案的 push/pull 同步到 Supabase。涵蓋 write notification channel、debounced upsert、full sync、pull-to-local、sync status API 與 UI

### Modified Capabilities

_(無既有 spec 需要修改——同步為新增疊加功能，不改變現有行為)_

## Impact

- **Backend**: 新增 `backend/sync/` 套件（~5 個檔案）、新增 `backend/api/auth_handler.go` 和 `sync_handler.go`、修改 `main.go`/`handler.go`/`router.go`/`store/io.go`/`store/store.go`/`model/settings.go`；SyncManager 加入每 3 分鐘的 single-flight 全量 reconciliation
- **Frontend**: 新增 auth store、sync status hook、auth/sync API 模組、SyncStatusIndicator 元件、WorkspaceSourceDialog 元件；修改 root route、header action 區和 types
- **Electron**: 修改 `main.js`（OAuth flow、token 持久化）和 `preload.js`（auth IPC）
- **API**: 新增 `/api/v1/auth/*` 和 `/api/v1/sync/*` route groups
- **Dependencies**: Backend 不新增外部依賴（使用 `net/http`）；Frontend 不新增 Supabase SDK（透過 backend 代理）
- **Infrastructure**: 需要建立 Supabase 專案、設定 Google Auth provider、建立 `workspace_files` 資料表
