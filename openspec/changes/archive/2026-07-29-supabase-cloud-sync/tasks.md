## 1. Supabase 專案設定與基礎設施

- [x] 1.1 在根目錄建立 `.env.example`，包含 `PINFLOW_SUPABASE_URL` 和 `PINFLOW_SUPABASE_ANON_KEY` 範本
- [x] 1.2 建立 `backend/sync/schema.sql`，包含 `workspace_files` 表的建表 SQL + RLS policy
- [x] 1.3 建立 `backend/sync/config.go`，定義 Supabase URL/anon key 常數，支援 `os.Getenv` 覆蓋

## 2. Backend Auth 模組

- [x] 2.1 建立 `backend/sync/sync.go`，定義共用型別（`SyncStatus`、`WorkspaceFile`、`AuthState`）
- [x] 2.2 建立 `backend/sync/auth.go`，實作 `ValidateToken()` 和 `RefreshToken()`（透過 `net/http` 呼叫 Supabase Auth API），以及 thread-safe auth state 管理
- [x] 2.3 建立 `backend/api/auth_handler.go`，實作 `POST/GET/DELETE /api/v1/auth/session` 三個 endpoints
- [x] 2.4 修改 `backend/api/handler.go`，加入 `Auth *AuthHandler` 欄位
- [x] 2.5 修改 `backend/api/router.go`，註冊 `/api/v1/auth` route group
- [x] 2.6 修改 `backend/model/settings.go`，加入 `SyncEnabled bool` 欄位（default false）
- [x] 2.7 修改 `backend/main.go`，初始化 sync 模組（auth state holder），傳入 handlers

## 3. Electron OAuth 流程

- [x] 3.1 修改 `electron/main.js`，實作 `startAuthFlow()`：系統瀏覽器開啟 Supabase OAuth URL + localhost:34116 callback server + `safeStorage` 加密儲存 refresh token
- [x] 3.2 修改 `electron/main.js`，實作 `loadSavedAuth()`：啟動時讀取加密 token 並呼叫 backend refresh
- [x] 3.3 修改 `electron/main.js`，實作 `clearAuth()`：刪除 auth.dat + 呼叫 backend logout
- [x] 3.4 修改 `electron/main.js`，註冊 IPC handlers：`auth:start`、`auth:status`、`auth:logout`
- [x] 3.5 修改 `electron/preload.js`，暴露 `startAuth`、`getAuthStatus`、`logout`、`onAuthChanged` 到 `window.electronAPI`

## 4. Frontend Auth UI

- [x] 4.1 建立 `frontend/src/lib/supabase.ts`，匯出 Supabase config 常數
- [x] 4.2 建立 `frontend/src/lib/api/auth.ts`，實作 `getAuthStatus()`、`setAuthSession()`、`deleteAuthSession()` API 呼叫
- [x] 4.3 修改 `frontend/src/lib/api/index.ts`，re-export auth API
- [x] 4.4 修改 `frontend/src/types/index.ts`，加入 `AuthStatus` interface 和 `Settings.syncEnabled` 欄位
- [x] 4.5 建立 `frontend/src/stores/authStore.ts`，Zustand store 管理 auth state（`isAuthenticated`、`userId`、`email`、`isLoading`、`login()`、`logout()`、`checkStatus()`）
- [x] 4.6 建立 `frontend/src/components/common/SyncStatusIndicator.tsx`，header 上的同步狀態 icon（未登入→登入按鈕，已登入→同步狀態）
- [x] 4.7 修改 `frontend/src/routes/__root.tsx`，mount 時呼叫 `authStore.checkStatus()`，加入 `<SyncStatusIndicator />`
- [x] 4.8 為本次新增或修改的前端同步／認證畫面加入繁中與英文翻譯鍵，確認不含硬編碼使用者文字

## 5. Backend Push Sync

- [x] 5.1 修改 `backend/store/io.go`，加入 write notification channel（`SetWriteNotifier` + `writeJSON` 成功後 non-blocking send）
- [x] 5.2 修改 `backend/store/store.go`，在 delete 方法中發送 `delete:<path>` 通知
- [x] 5.3 建立 `backend/sync/client.go`，Supabase REST client（`UpsertFile`、`ListFiles`、`DeleteFile`），含 401 自動 refresh 重試
- [x] 5.4 建立 `backend/sync/manager.go`，SyncManager goroutine（channel 讀取 → 500ms debounce → 批次 upsert → delete 處理 → status 管理）
- [x] 5.5 建立 `backend/api/sync_handler.go`，實作 `GET /api/v1/sync/status`、`POST /api/v1/sync/trigger`、`PATCH /api/v1/sync/enable`
- [x] 5.6 修改 `backend/api/handler.go`，加入 `Sync *SyncHandler` 欄位
- [x] 5.7 修改 `backend/api/router.go`，註冊 `/api/v1/sync` route group
- [x] 5.8 修改 `backend/main.go`，建立 SyncManager、設定 write notifier、啟動 goroutine、graceful shutdown

## 6. Frontend Sync Status UI

- [x] 6.1 建立 `frontend/src/lib/api/sync.ts`，實作 `getSyncStatus()`、`triggerSync()`、`setSyncEnabled()` API 呼叫
- [x] 6.2 修改 `frontend/src/lib/api/index.ts`，re-export sync API
- [x] 6.3 建立 `frontend/src/hooks/sync/queries/useSyncStatus.ts`，TanStack Query hook，每 5 秒 polling sync status（僅在已認證時）
- [x] 6.4 更新 `frontend/src/components/common/SyncStatusIndicator.tsx`，整合 `useSyncStatus` 顯示即時狀態（idle/syncing/error/offline）、最後同步時間、手動同步按鈕

## 7. Pull Sync

- [x] 7.1 在 `backend/sync/manager.go` 加入 `PullFromCloud()` 方法（ListFiles → 寫入本地 workspace → ReloadAll）
- [x] 7.2 修改 `backend/store/store.go`，加入 `ReloadAll()` 方法（清空 in-memory maps + 重新 `load()`）
- [x] 7.3 在 `backend/api/sync_handler.go` 加入 `POST /api/v1/sync/pull` endpoint
- [x] 7.4 建立 `frontend/src/components/common/CloudPullDialog.tsx`，登入後偵測空 workspace + 雲端有資料時顯示下載確認對話框
- [x] 7.5 更新 `frontend/src/routes/__root.tsx`，auth 完成後檢查是否需要顯示 CloudPullDialog

## 8. 同步可靠性與 Header 控制選單

- [x] 8.1 更新 `backend/sync/manager.go`，加入每 3 分鐘觸發的 full reconciliation ticker，僅在已認證且同步啟用時執行
- [x] 8.2 為手動與定期 full sync 加入 single-flight guard，避免重疊執行，並加入 Backend 測試覆蓋啟用、停用、未登入與重疊情境
- [x] 8.3 將 `SyncStatusIndicator` 改為 authenticated dropdown，顯示帳號 email、同步狀態、最後同步時間、啟用／停用、立即同步與登出
- [x] 8.4 將同步入口移入既有 header action layout 並排列在 Pinned Tasks 左側，移除會遮擋其他操作的 fixed／absolute 定位
- [x] 8.5 串接 dropdown actions 的 loading/error 狀態與 auth/sync query 更新，確認登出不刪除或阻擋本機 workspace
- [x] 8.6 補齊新增 UI 的 `en-US`／`zh-TW` 翻譯與前端測試，涵蓋 dropdown 操作、登出及 Header 不重疊

## 9. 登入後 Workspace 資料來源選擇

- [x] 9.1 在 Backend SyncManager 加入每次認證 session 的 source-decision state；偵測既有雲端資料時標記 pending，並阻擋 push、手動 full sync 與每 3 分鐘 reconciliation
- [x] 9.2 擴充 Supabase REST client，支援刪除目前使用者的全部 `workspace_files` rows，並加入使用者隔離測試
- [x] 9.3 實作以雲端取代本機：完整抓取成功後才清除本機受管理 JSON、寫入雲端檔案並 `ReloadAll()`；失敗時不得改動本機
- [x] 9.4 實作以本機取代雲端：刪除目前使用者的雲端 rows 後全量上傳本機 workspace，並正確更新 source-decision 與 sync status
- [x] 9.5 新增 `GET/POST /api/v1/sync/source`、Frontend API 與型別，並在登入、token 自動恢復、登出及切換帳號時正確初始化或清除 decision state
- [x] 9.6 將 `CloudPullDialog` 改為 localized `WorkspaceSourceDialog`，提供「使用雲端資料」、「使用這台裝置的資料」、「稍後決定」、取代警告、loading/error、query cache 更新，並可從同步 dropdown 重新開啟
- [x] 9.7 加入 Backend 與 Frontend 自動測試，涵蓋 example board 保留、pending 時禁止同步、雙向取代、失敗保護、稍後決定及重新開啟對話框

## 10. 測試與驗證

- [x] 10.1 驗證 Phase 1：app 不登入時所有功能正常且 example board 可用、OAuth 登入流程完整、token 持久化與自動恢復、從 Header dropdown 登出
- [x] 10.2 驗證 Phase 2：建立/編輯/刪除 card 後 Supabase 對應 row 變化、debounce 生效、斷網/恢復行為、手動全量同步與每 3 分鐘 reconciliation
- [x] 10.3 驗證 Phase 3：登入已有雲端資料的帳號時顯示資料來源選擇；分別驗證以雲端取代本機、以本機取代雲端及稍後決定

## 11. 驗證修正

- [x] 11.1 統一 Backend 與 Electron 的 Supabase 設定來源，支援安全的編譯期預設值與環境變數覆蓋
- [x] 11.2 修正 write/delete notification 契約，傳送 workspace-relative path 並在刪除 Board 時通知所有受管理 JSON
- [x] 11.3 實作單次 batch upsert、離線 pending 保留與後續重試，並正確回報 offline 狀態
- [x] 11.4 將 Supabase 401 refresh retry 限制為一次，refresh 失敗時清除 auth state
- [x] 11.5 為 Backend HTTP server 與 SyncManager 加入 signal-driven graceful shutdown
- [x] 11.6 補齊 SyncStatusIndicator 的 idle、error、offline、disabled 視覺狀態與測試
- [x] 11.7 修正 Frontend 全套測試與 lint 錯誤
- [x] 11.8 補齊 Backend 同步 edge-case 測試並通過 OpenSpec、Backend、Frontend 全套驗證
