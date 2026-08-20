## Why

PinFlow 的後端會在 Supabase access token 過期時自動刷新 session，但輪替後的 refresh token 只保存在後端記憶體，Electron 的加密 session 檔仍保留舊 token。長時間執行或重新啟動後可能因此失去登入狀態，停止原本應持續執行的背景同步，且前端不一定會立即反映失效狀態。

## What Changes

- 讓後端每次成功刷新 Supabase session 後，安全地將最新的 rotated refresh token 提供給 Electron 主程序持久化。
- 讓 Electron 在啟動恢復、執行期間 token 輪替及系統喚醒後，都能保存最新 session 並重新確認後端認證狀態。
- 讓 token 刷新失敗或後端清除 session 時，Electron 與 React auth store 能收到認證狀態變更，避免介面仍顯示已登入但同步已停止。
- 維持後端每 3 分鐘 reconciliation 與寫入 debounce 同步；電腦喚醒或暫時離線後，應可在認證仍有效時恢復同步。
- 增加 token rotation、跨重啟 session 恢復、認證失效通知及背景同步續行的自動化測試。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `supabase-auth`: 要求 rotated refresh token 在每次刷新後持久化，並要求後端認證失效能同步通知 Electron 與前端狀態。
- `cloud-sync`: 要求週期同步在 token 輪替、App 長時間閒置及系統喚醒後維持或恢復運作，不得因前端視窗背景化而停止。

## Impact

- 後端：`backend/sync/` 的 auth state、token refresh 與 Manager 生命週期，以及相關 auth/sync API。
- Electron：`electron/main.js`、`electron/preload.js` 的加密 session persistence、後端狀態協調與 IPC 通知。
- 前端：`frontend/src/stores/authStore.ts` 及同步狀態呈現，確保 session 失效時即時回到未登入狀態。
- 測試：後端 auth/client/manager 測試，以及 Electron 或前端的 session 狀態整合測試。
- 不變更 Supabase schema，也不影響未登入時的離線本機功能。
