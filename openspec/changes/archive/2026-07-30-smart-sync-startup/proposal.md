## Why

PinFlow 打包版應用程式在重啟後，使用者必須重新登入（`loadSavedAuth` 靜默失敗時刪除 token）並重新選擇 cloud/local 資料來源（`SourceState` 僅存於記憶體）。這讓多裝置同步體驗大打折扣——使用者期望重啟後自動恢復登入，並根據時間戳智慧判斷該 push 或 pull，無需每次手動選擇。

## What Changes

- 修復 Electron `loadSavedAuth()` 的錯誤處理：區分「token 過期」與「暫時性網路錯誤」，後者保留 `auth.dat` 以便下次重試，並加上 log 追蹤
- 在 `settings.json` 新增 `sourceDecisionMade`、`lastSyncedAt`、`lastSyncedUserId` 欄位，持久化來源決策狀態
- 新增 Supabase migration：`updated_at` trigger 確保每次 upsert 都更新時間戳
- 新增 `GetLatestUpdatedAt()` 查詢雲端最新時間戳
- 重構 `InitializeSourceDecision`：首次仍顯示對話框，非首次走時間戳比對自動 pull/push
- 自動同步完成後顯示 toast 通知（不阻塞操作）

## Capabilities

### New Capabilities

- `sync-auto-decision`: 基於本地與雲端時間戳的自動同步決策邏輯，包含 auto-pull、auto-push、toast 通知

### Modified Capabilities

- `supabase-auth`: 修改 Electron `loadSavedAuth` 的錯誤處理行為——暫時性網路錯誤不再刪除 `auth.dat`
- `cloud-sync`: 修改 workspace source decision 行為——首次決策後持久化，非首次啟動改用時間戳比對自動決定

## Impact

- **Backend**: `model/settings.go`、`store/persistence.go`、`sync/sync.go`、`sync/client.go`、`sync/manager.go`、`api/sync_handler.go`
- **Frontend**: `components/common/WorkspaceSourceDialog.tsx`、`locales/zh-TW.json`、`locales/en-US.json`
- **Electron**: `electron/main.js`（loadSavedAuth 錯誤處理）
- **Supabase**: 新增 migration（`updated_at` trigger）
- **Tests**: `tests/sync/manager_test.go`（fakeCloudClient 擴展 + 新增測試案例）
