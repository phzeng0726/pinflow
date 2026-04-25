## Context

PinFlow 使用 file-based workspace（`boards/board-N/board.json`, `columns.json`, `cards/*.json`），由 `backend/store/FileStore` 管理 in-memory state + 寫入磁碟。目前不存在任何版本控制或還原機制，誤刪 column / card 後資料永久遺失。

現有架構：`FileStore`（in-memory + JSON 磁碟）→ `Repository`（資料存取） → `Service`（業務邏輯）→ `Handler`（Gin HTTP）。Service 層各自獨立，無集中 hook 或事件系統。

## Goals / Non-Goals

**Goals:**
- 在不修改現有 service / handler 邏輯的前提下，加入 board-level 快照機制
- 破壞性動作（delete column, delete card）前同步建立快照；create/update 動作後以 debounce 非同步建立
- 支援手動快照（命名，永久保留）與自動快照（保留 7 天）
- 還原整個 board 至指定快照；還原前自動建立安全網快照
- 快照儲存於 workspace 內，隨 workspace Git 同步

**Non-Goals:**
- Undo/Redo 操作堆疊（避免與文字輸入 Ctrl+Z 衝突）
- 細粒度還原（僅還原單張 card 或單個 column）
- 跨裝置 Git merge conflict 解決（workspace 設計的通用問題）
- 圖片去重（初版做硬拷貝）

## Decisions

### 1. 快照儲存位置：board 目錄內的 `.snapshots/`

快照存放在 `boards/board-N/.snapshots/snap-{id}/`，index metadata 放 `index.json`。

**為何不用全局 `workspace/snapshots/`？** Board 刪除時快照去向不明；board 目錄結構天然支援快照跟隨 board。

**為何不用 Git commit？** 跨平台 Git 依賴管理複雜，合併衝突難以在 desktop app 中優雅處理。

快照包含：`board.json`、`columns.json`、`cards/`、`images/`（硬拷貝）、`tags.json`（此 board 使用到的 tag subset）、`dependencies.json`（此 board 相關 dependency subset）、`meta.json`（id, name, isManual, trigger, createdAt）。

### 2. 觸發機制：Gin Middleware（不動 service 層）

在 `api/middleware/snapshot.go` 中以 route metadata table 宣告哪些 route 觸發快照、用何種模式。Middleware 掛在 `/api/v1` group，`c.Next()` 前後各自處理 sync / debounce 模式。Handler 與 service 完全不修改。

**為何不在 service 層注入？** Service 層確實有 boardID 脈絡，但每個 service 方法都要新增依賴與呼叫，侵入範圍大。Middleware 是橫切關注點（cross-cutting concern）的標準解法。

**為何不用 Gin middleware 全局攔截（無 table）？** 無法精確判斷哪些 route 應觸發、各用哪種模式；table 讓規則一目瞭然且易於維護。

Middleware 需要從 path param（cardID / columnID）反查 boardID，透過 `FileStore.BoardIDOf*(id)` 在 in-memory map 做 O(1) 查詢。

**sync vs debounce 規則：**
- `sync`（delete 類）：`c.Next()` 前執行快照，確保資料刪除前已備份
- `debounce`（create / update 類）：`c.Next()` 後，確認回應 2xx 才觸發，同步執行（桌面單人 app 延遲可接受，且避免 goroutine race condition 需額外加鎖）；同 board 10 分鐘內已有自動快照則 skip

### 3. 還原策略：覆蓋原 ID + FileStore.ReloadBoard()

還原時保持原 card / column ID，直接覆寫 board-N/ 目錄的 JSON 檔，再呼叫 `FileStore.ReloadBoard(boardID)` 清空並重載該 board 的 in-memory state。

**為何不重新分配 ID？** 重分配需要 remap 所有 dependency、tag 引用，邏輯複雜且容易出錯；保留原 ID 可避免此問題，且 card 的深連結、pin 狀態不失效。

**ID 衝突處理：** 還原後將 `manifest.json` 的 `NextIDs` 更新為 `max(current, snapshot 中最大 ID + 1)`，確保後續新建 entity 不衝突。

**Tags 合併：** 讀 snapshot `tags.json`，對每個 tag 以 id 查詢 global `tags.json`，若不存在則重建（保留 id）。Global tag 若 id 已被其他 tag 佔用（罕見情況），以 name+color 匹配或建新 id 並 remap cards 中的 tagIDs。

### 4. 保留策略：自動 7 天，手動永久

每次建立新自動快照時掃描 `index.json`，刪除 `isManual=false` 且 `createdAt < now - 7d` 的快照（含目錄）。`restore-before-*` 快照標記為 `isManual=false` 但 trigger 為 `restore`，7 天後同樣清理。

## Risks / Trade-offs

- **Workspace 膨脹（圖片硬拷貝）** → 初版接受此 trade-off；後續可改 content-addressed 去重（hash 檔名）
- **Sync 模式 before-delete snapshot 在 delete 失敗時留有多餘快照** → Fail-safe，多一個無害快照可接受
- **ReloadBoard 持 write lock 期間暫時阻擋其他請求** → 單人桌面 app 可接受，鎖時間短（毫秒級檔案 copy）
- **Git 同步衝突** → 兩台裝置同時建立快照可能 conflict `.snapshots/index.json`。這是 workspace 設計的已知限制，不在本 change 範圍內處理
- **debounce 以 10 分鐘為判斷依據** → 以最後一筆 `index.json` 的自動快照 `createdAt` 比較，不需要額外定時器或 TTL store
