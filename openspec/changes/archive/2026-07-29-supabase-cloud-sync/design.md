## Context

PinFlow 使用 file-based JSON 儲存（`backend/store/FileStore`），所有資料在啟動時載入記憶體，寫入時同步持久化到 JSON 檔案。目前沒有任何雲端同步、認證、或遠端備份機制。

現有架構：
- Backend：Go + Gin，`store/io.go` 的 `writeJSON()` 是所有磁碟寫入的單一出口
- Frontend：React + Zustand + TanStack，Axios client 無 auth interceptor
- Electron：spawns Go backend，`preload.js` 透過 `contextBridge` 暴露 IPC API

Supabase 被選為雲端同步目標，因其內建 Auth（免自行處理 OAuth 審核）、PostgREST API（Go 可用 `net/http` 直接呼叫）、RLS（資料隔離一條 policy 搞定）。

## Goals / Non-Goals

**Goals:**

- 本地 JSON 維持 single source of truth，離線時 app 100% 可用
- Auth 為可選——不登入不影響任何既有功能
- 本地檔案變更自動 push 到 Supabase（debounced）
- 新 workspace 無論是否登入都建立 example board；登入後若帳號已有雲端資料，由使用者選擇本機或雲端作為 workspace 來源
- 最小侵入現有架構——sync 為獨立模組，不重構 FileStore/Repository/Service

**Non-Goals:**

- 即時多裝置雙向同步（real-time collaboration）
- 衝突合併 UI（使用 last-write-wins）
- Web 版 PinFlow（未來再議）
- 多人共享看板
- 支援 Google 以外的 OAuth provider（初期僅 Google）

## Decisions

### D7: Frontend localization

All frontend additions in this change use `react-i18next` and keys in both `frontend/src/locales/en-US.json` and `frontend/src/locales/zh-TW.json`. This keeps cloud-sync UI consistent with the existing locale switcher and prevents untranslated UI when the locale changes.

### D1: Sync 觸發方式 — Hook into `writeJSON()` vs File watcher

**選擇：Hook into `writeJSON()`**

在 `store/io.go` 的 `writeJSON()` 成功後，將相對路徑 non-blocking send 到 channel。Sync goroutine 從 channel 讀取、debounce 500ms 後批次 upsert。

**理由：** File watcher（fsnotify）在 Windows 上有已知的可靠性問題（路徑長度限制、事件遺漏），且需要額外依賴。Hook 方式零延遲、零依賴、確定性觸發。

**代價：** AI Agent 或外部程式直接修改 JSON 檔案時不會觸發同步。這是可接受的——使用者可手動觸發 full sync。

### D2: Supabase Client — Go SDK vs 直接 REST

**選擇：直接使用 `net/http` 呼叫 Supabase PostgREST API**

PostgREST API 就是標準 REST，只需 `apikey` + `Authorization: Bearer` header。Upsert 用 `POST` + `Prefer: resolution=merge-duplicates`。

**理由：** 現有 Go SDK（supabase-community/supabase-go）成熟度不足且 API 不穩定。直接 REST 零外部依賴、完全掌控、易於除錯。

### D3: Auth 流程 — Electron 中的 OAuth

**選擇：系統瀏覽器 + localhost callback server**

1. Electron main process 啟動臨時 HTTP server（port 34116）
2. 開啟系統預設瀏覽器導向 Supabase OAuth URL（`redirect_to=http://localhost:34116/auth/callback`）
3. 使用者在瀏覽器完成 Google 登入
4. Supabase redirect 回 localhost:34116，帶著 tokens
5. 臨時 server 擷取 tokens 後關閉
6. Refresh token 用 `safeStorage.encryptString()` 加密存到 `{userData}/auth.dat`

**理由：** 比 Electron BrowserWindow 內嵌登入更安全（避免 token 洩漏到 renderer process），且 Google 建議 native app 使用系統瀏覽器做 OAuth。

### D4: Token 傳遞路徑

**選擇：Frontend → Backend → Supabase**

Frontend 透過 Electron IPC 觸發 OAuth → Electron main process 取得 tokens → 透過 `POST /api/v1/auth/session` 傳給 Go backend。Backend 持有 tokens 並負責所有 Supabase API 呼叫。Frontend 不直接與 Supabase 通訊。

**理由：** 同步邏輯全在 backend（hook into writeJSON），tokens 只需在 backend 持有。Frontend 不裝 Supabase SDK，減少複雜度。

### D5: Supabase 資料結構 — Normalized tables vs JSON blob

**選擇：JSON blob（一行一個檔案）**

```sql
workspace_files (user_id, path, content JSONB, updated_at)
```

每個 JSON 檔案（board.json、card-1.json 等）對應一行，`content` 存完整 JSON。

**理由：** 最簡單、與本地 file 結構 1:1 對應、push/pull 邏輯直覺。Supabase 免費額度 500MB 足夠。未來若需正規化可漸進遷移。

### D6: 登入後的資料來源與衝突處理

**選擇：登入時明確選擇單一來源，並以該來源完整取代另一端**

新 workspace 仍照常建立 example board，確保未登入時可立即使用。使用者登入後，若該帳號沒有雲端資料，維持本機 workspace 並可由使用者啟用同步；若帳號已有雲端資料，Frontend 顯示資料來源選擇對話框：

1. **使用雲端資料**：清除本機 workspace 的受管理 JSON 資料，再下載全部雲端檔案並 `ReloadAll()`。
2. **使用這台裝置的資料**：清除該使用者的全部雲端 workspace rows，再上傳目前本機 workspace 的全部 JSON。
3. **稍後決定**：不修改任何一端，保持同步停用。

偵測到雲端資料但尚未完成選擇時，sync manager 進入 source-decision-pending 狀態。500ms push、手動 full sync 與每 3 分鐘 reconciliation 均不得執行，避免 example board 或既有本機內容在使用者選擇前覆蓋雲端。

**理由：** 本機與雲端可能同時包含相同 path（例如 `boards/board-1/board.json`）及互相衝突的 manifest ID counter。逐檔合併會產生不一致 workspace；由使用者選擇單一來源並完整取代，結果較明確且可預測。

### D8: 同步可靠性 — 即時 push 加定期 reconciliation

**選擇：500ms debounced push 為主要同步路徑，Backend SyncManager 每 3 分鐘執行一次全量 reconciliation**

本地寫入成功後仍透過 notification channel 立即排入 500ms debounce push。SyncManager 另外維護 3 分鐘 ticker，在使用者已認證且 `syncEnabled` 為 true 時掃描 workspace 內所有 JSON 並 full upsert。

Full sync 採 single-flight：手動同步或定期 reconciliation 已在執行時，新的 full sync 不並行啟動。離線或失敗不阻擋本地操作，後續 interval 可再次嘗試。

**理由：** 即時 push 提供低延遲；定期 reconciliation 可補足 channel 滿載、外部程式直接修改 JSON、或短暫網路失敗造成的通知遺漏。將 ticker 放在 Backend 可避免依賴 renderer 是否 mount，並讓所有 Electron 視窗共享同一排程。

**代價：** 每 3 分鐘會重新掃描 workspace 並重送未變更內容。現階段 workspace 規模小，可靠性優先於增量 hash 或遠端 diff 的複雜度。

### D9: 同步與帳號控制 — Header dropdown

**選擇：將 SyncStatusIndicator 放入既有 header action layout，並以 dropdown 集中同步與帳號操作**

同步控制不使用 `fixed` 或 `absolute` 浮動定位。當畫面有 Pinned Tasks action 時，SyncStatusIndicator 排在其左側。Authenticated dropdown 顯示 email、同步狀態、最後同步時間、啟用／停用、立即同步與登出；未登入時維持單一登入 icon。

**理由：** Header action layout 能自然處理視窗寬度與點擊區域，避免浮動元件遮住 Pinned Tasks。將狀態、同步與帳號操作集中在同一 dropdown，也比增加多顆 header icon 更容易理解。

### D10: Supabase 部署設定 — Backend 單一設定來源

**選擇：環境變數優先，release build 可透過 Go linker flags 嵌入部署值，Electron 從 Backend config endpoint 取得有效 URL**

原始碼不包含特定 Supabase 專案憑證。開發環境使用 `PINFLOW_SUPABASE_URL` 與 `PINFLOW_SUPABASE_ANON_KEY`；打包流程在變數存在時以 `-ldflags -X` 寫入 binary。Electron 不再自行讀取 URL，避免 packaged app 與 Backend 使用不同設定。若兩種來源皆未設定，僅停用雲端登入與同步，本機功能維持可用。

**理由：** anon key 雖可公開，但仍屬部署設定，不應在通用原始碼中虛構或綁定未知專案。單一有效設定來源也能消除 Electron 與 Backend 的設定漂移。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Supabase anon key 在 client 端可見 | 這是 Supabase 設計——anon key 是 public 的，RLS 確保使用者只能存取自己的資料 |
| OAuth redirect port 34116 被佔用 | 啟動時檢測 port 可用性，不可用則 fallback 到隨機 port |
| 大量檔案同時變更導致 Supabase rate limit | 500ms debounce + 批次 upsert（一次 request 多筆）。Supabase 免費額度 500 requests/s 足夠 |
| Refresh token 過期（長時間離線後） | 嘗試 refresh 失敗時提示重新登入，不阻擋 app 使用 |
| 資料來源選擇會取代另一端資料 | 對話框明確標示取代範圍；選擇前保持同步停用，並提供「稍後決定」避免誤操作 |
| `writeJSON` hook 的 channel buffer 滿 | 使用 buffered channel（容量 1000）+ non-blocking send，溢出時 log warning 並在下次 full sync 補上 |
| 定期 full sync 與手動同步重疊 | SyncManager 使用 single-flight guard，同時間只允許一個 full sync |
| Header action 在窄視窗空間不足 | 使用既有 header action layout 與 dropdown，禁止 fixed overlay，確保 Pinned Tasks 與同步入口皆可點擊 |
