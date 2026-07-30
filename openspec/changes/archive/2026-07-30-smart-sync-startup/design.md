## Context

PinFlow 使用 Supabase 進行工作區雲端備份。目前的同步啟動流程有兩個問題：

1. `loadSavedAuth()`（`electron/main.js:104-107`）的 `catch` 區塊靜默刪除 `auth.dat`，不區分暫時性錯誤與認證過期
2. `InitializeSourceDecision()`（`manager.go:109-145`）每次 session 建立都重新執行，`SourceState` 僅存於記憶體——即使使用者先前已選擇過

Supabase `workspace_files` 表已有 `updated_at` 欄位但未被使用：沒有 trigger 更新它、程式碼未查詢它。

## Goals / Non-Goals

**Goals:**
- 重啟後自動恢復登入狀態（修復 loadSavedAuth 錯誤處理）
- 持久化來源決策，非首次啟動不再彈出對話框
- 利用時間戳自動判斷 push/pull 方向
- 自動同步完成時以 toast 通知使用者

**Non-Goals:**
- 檔案層級的衝突合併（merge）——本次只做整個 workspace 的方向判斷
- 多裝置同時線上的即時同步——仍依賴 3 分鐘 reconciliation
- 修改 Supabase RLS policy 或 workspace_files 表結構（只加 trigger）

## Decisions

### D1: 持久化狀態存放在 settings.json

**選擇**: 在 `model.Settings` 新增 `sourceDecisionMade`、`lastSyncedAt`、`lastSyncedUserId` 三個 `omitempty` 欄位。

**替代方案**: 獨立的 `sync-state.json` 檔案。

**理由**: `settings.json` 已有完整的讀寫基礎設施（`GetSettings`/`persistSettings`/`SetSyncEnabled`），且與 `syncEnabled` 語意一致。`omitempty` 確保舊版 workspace 讀入時零值即正確預設。`settings.json` 會被同步到雲端，但 `lastSyncedAt` 在 pull 完成後立即更新，不會造成問題。

### D2: 雲端時間戳透過 PostgREST 排序查詢

**選擇**: `GET /rest/v1/workspace_files?select=updated_at&order=updated_at.desc&limit=1` 取得最新時間戳。

**替代方案**: Supabase Database Function (`rpc`)。

**理由**: PostgREST 原生支援排序 + limit，單次 HTTP 請求即可完成，不需要額外的 DB function migration，減少維護負擔。

### D3: 時間戳比對容差 2 秒

**選擇**: 本地與雲端時間差在 ±2 秒內視為「已同步」。

**理由**: 本地時鐘與 Supabase 伺服器時鐘可能有輕微偏差。2 秒是保守的容差，避免因時鐘偏移觸發不必要的 pull/push。Debounce push 間隔為 500ms，2 秒足以覆蓋。

### D4: loadSavedAuth 區分錯誤類型

**選擇**: 捕獲 `backendRequest` 的錯誤，檢查是否為網路錯誤（`ECONNREFUSED`、`ETIMEDOUT`、`fetch failed` 等）。網路錯誤保留 `auth.dat`；其他錯誤（401、token expired）刪除 `auth.dat`。

**替代方案**: 所有錯誤都保留 `auth.dat`，加入重試次數上限。

**理由**: 認證過期的 token 保留無意義，只會讓每次啟動都嘗試並失敗。網路錯誤是暫時的，保留讓下次啟動可以重試。使用 `electron-log`（已在專案中）記錄所有失敗。

### D5: AutoAction 透過 SourceState 傳遞

**選擇**: 在 `SourceState` 新增 `AutoAction string` 欄位（`"pulling"/"pulled"/"pushing"/"pushed"`），前端透過現有的 `useWorkspaceSource` 輪詢機制偵測。

**替代方案**: 透過 Electron IPC 主動推送事件。

**理由**: 前端已有 `useWorkspaceSource` hook 輪詢 `GET /sync/source`，不需要新增通訊管道。`WorkspaceSourceDialog` 組件已監聽 `source.data`，在同一個組件加入 toast 邏輯即可。完成後 `autoAction` 保持在 `"pulled"/"pushed"` 直到前端讀取——不需要 ack 端點，因為它會在下次 `InitializeSourceDecision` 被重設。

### D6: `InitializeSourceDecision` 分為首次與非首次路徑

**選擇**: 讀取 `settings.SourceDecisionMade` 和 `settings.LastSyncedUserID` 分流：
- 首次（或帳號切換）→ 現有行為（`ListFiles` 檢查雲端、有資料則 pending）
- 非首次 → `GetLatestUpdatedAt` 比對時間戳、自動決定方向

**理由**: 最小化對現有流程的改動。首次流程與目前完全一致，只是完成後多寫入 `sourceDecisionMade`。非首次是全新路徑，不影響既有邏輯。

## Risks / Trade-offs

**[時鐘偏移]** 本地 `lastSyncedAt` 用本地時鐘，雲端 `updated_at` 用伺服器時鐘。
→ 2 秒容差緩解輕微偏移。極端時鐘偏移可能導致錯誤方向判斷，但這在實務中極少見。

**[settings.json 被同步]** `lastSyncedAt` 存在 `settings.json` 中，而 `settings.json` 本身會被 push 到雲端。從雲端 pull 時會覆蓋 `lastSyncedAt`。
→ Pull 完成後立即更新 `lastSyncedAt`，覆蓋從雲端拉下的值。

**[auto-pull 期間的寫入]** 如果使用者在 auto-pull 進行中操作了 app，本地寫入可能被 pull 覆蓋。
→ Auto-pull 使用 `ReplaceJSONFiles`（原子操作），pull 完成後 `ReloadAll` 刷新記憶體。啟動時使用者通常不會立即操作。

**[多裝置同時修改]** 兩台裝置離線修改後同時上線，較舊的修改可能覆蓋較新的。
→ 超出本次範圍。目前的「全量替換」策略在單人多裝置場景下足夠——使用者通常一次只在一台裝置上操作。
