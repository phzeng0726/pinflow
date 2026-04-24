## Context

PinFlow 桌面版 (Electron) 以 `file://` 協定載入前端，導致 Zustand `persist` middleware 寫入的 `localStorage` 無法跨重啟保留。後端已有完整的 workspace 目錄作為 file-based JSON 儲存機制（boards、tags 等均存為 JSON），可直接沿用此模式新增 `settings.json`。

## Goals / Non-Goals

**Goals:**
- 新增 `GET /api/v1/settings` 與 `PUT /api/v1/settings` API
- settings 存於 workspace 的 `settings.json`，跟 boards/tags 等並列
- 前端啟動時 hydrate Zustand stores，切換時 fire-and-forget 寫回 API
- 桌面版與網頁版行為完全一致

**Non-Goals:**
- 多使用者 / 帳號隔離（workspace 目前為單人本地使用）
- 設定同步 across workspaces
- 新增除 theme、locale 以外的設定欄位（可之後擴充）

## Decisions

### D1：Settings 存在後端 workspace，而非 Electron main process

**選擇**：後端 API + workspace 的 `settings.json`

**替代方案**：
- Electron main process 的 `app.getPath('userData')/settings.json` via IPC：只對桌面版有效，網頁版無法共用
- 繼續使用 localStorage：Electron `file://` 下無法保留

**理由**：後端 API 讓網頁版與桌面版共用同一套邏輯；workspace 本身已 git-syncable，settings 也可一起同步。

### D2：前端 hydrate 策略

**選擇**：在 `__root.tsx` 的 `useEffect` 中呼叫 `GET /api/v1/settings`，拿到結果後用 `setState` 更新 themeStore 與 localeStore，再呼叫 `apply()`。

**理由**：
- 保持 Zustand store 作為 UI 的 single source of truth
- 切換時仍是即時更新（先更新 store，再 fire-and-forget PUT）
- 不需要 loading state，初始值就是預設值（light / en-US），hydrate 後若不同會觸發 useEffect 重新 apply

### D3：後端 Settings 為 singleton（無 ID）

**選擇**：`settings.json` 直接存一個 JSON object，GET 回傳整個 object，PUT 做 partial merge

**理由**：設定不是 collection，不需要 ID；PUT 用 pointer fields (`*string`) 做 partial update，未帶欄位不覆蓋

### D4：移除 Zustand persist middleware

**選擇**：從 themeStore 與 localeStore 完全移除 `persist`，改為 API hydrate

**理由**：persist 依賴 localStorage，移除後可避免兩個儲存來源互相衝突

## Risks / Trade-offs

- **首次啟動短暫 flash**：API 回應前，store 為預設值（light / en-US），hydrate 後若不同會有短暫 layout shift → 可接受，因為 API 在 localhost 且延遲極低（< 10ms）
- **backend 未啟動時 settings 無法讀取**：Electron 啟動流程已有 waitForBackend 健康檢查，正常不會發生；網頁版開發時自行啟動 backend → 可接受
- **settings 跟隨 workspace**：切換 workspace 會載入不同 settings → 合理行為（workspace 即工作環境）
