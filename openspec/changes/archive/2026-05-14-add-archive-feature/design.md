## Context

PinFlow 目前的 Card 和 Column 只支援永久刪除，沒有軟刪除或封存機制。Backend 使用 Go + Gin + file-based JSON storage（每張卡片儲存為獨立的 `card-N.json`，欄位儲存於 `columns.json`）。Frontend 使用 React 19 + TanStack Query + shadcn/ui。

現有資料模型：Card 有 `IsPinned`、`StartTime`、`EndTime` 等 nullable 欄位，均為 `*time.Time` 型別，Pattern 已成熟。Store 使用 in-memory map + JSON write-through，所有查詢從 memory 讀取。

## Goals / Non-Goals

**Goals:**
- 讓卡片和欄位可以封存（從看板隱藏但不刪除）
- 提供 Archive Drawer UI 讓使用者管理封存項目
- 支援還原和永久刪除封存項目
- 封存項目從看板視圖、搜尋、釘選清單中隱藏

**Non-Goals:**
- 批次封存/還原多個項目
- 跨 board 的封存管理
- 封存歷史紀錄或審計日誌
- 封存期限自動到期機制

## Decisions

### 1. 封存機制：inline `ArchivedAt *time.Time` 欄位

**選擇**：在 Card model、Column model、CardFile struct 上新增 `ArchivedAt *time.Time` 欄位。`nil` = 未封存；有值 = 已封存，值為封存時間。

**理由**：與現有 `StartTime`、`EndTime` 欄位 pattern 一致，向下相容（舊 JSON 無此欄位，反序列化後為 `nil`），不需要額外的儲存結構或 migration。

**備選方案考慮**：
- 獨立封存儲存（archive.json）→ 需要額外維護同步，增加複雜度
- Status enum 欄位 → 語義較模糊，不符合現有 nullable 時間欄位 pattern

### 2. 欄位封存不連帶標記卡片

**選擇**：封存整個 column 時，只在 column 上設定 `ArchivedAt`，不修改其內的 cards。

**理由**：
- 還原 column 時，其內所有未個別封存的 cards 自動跟著回到看板（只需清除 column.ArchivedAt）
- 避免批次修改大量 card 的 write amplification
- 個別封存的 cards（有自己的 ArchivedAt）維持獨立管理

**Archive Drawer 顯示邏輯**：
- Cards tab：`card.ArchivedAt != nil` 的 cards
- Columns tab：`column.ArchivedAt != nil` 的 columns（附帶欄位內卡片總數）
- 封存欄位內的 cards 不在 Cards tab 中重複顯示

### 3. Store 層過濾：修改現有查詢方法

**選擇**：在 store layer 的 `GetColumnsByBoard`、`GetCardsByColumn`、`GetPinnedCards`、`SearchCards` 中直接過濾 `ArchivedAt != nil` 的項目。

**理由**：過濾在最底層進行，上層 repository/service/handler 無需感知，改動最小。新增 `GetArchivedCardsByBoard` 和 `GetArchivedColumnsByBoard` 方法供封存查詢使用。

**另一方案**：在 repository 層過濾 → 需要每個 repository 方法都加條件，改動面較大。

### 4. 封存卡片的還原位置

**選擇**：還原卡片時，position 設定為目前 column 中最小 position 減 1024（或若 column 為空則設 1024.0），放到欄位最上方。

**理由**：與現有 `MoveCard` 使用 float64 position 的 pattern 一致，不需要重新排序其他 cards。

### 5. Archive 路由設計

**選擇**：
- `PATCH /api/v1/cards/:id/archive` — 封存卡片
- `PATCH /api/v1/cards/:id/restore` — 還原卡片
- `DELETE /api/v1/cards/:id/archive` — 永久刪除封存卡片
- `PATCH /api/v1/columns/:id/archive` — 封存欄位
- `PATCH /api/v1/columns/:id/archive-cards` — 封存欄位內所有卡片
- `PATCH /api/v1/columns/:id/restore` — 還原欄位
- `DELETE /api/v1/columns/:id/archive` — 永久刪除封存欄位
- `GET /api/v1/boards/:id/archive/cards` — 查詢封存卡片清單
- `GET /api/v1/boards/:id/archive/columns` — 查詢封存欄位清單

**理由**：語義清晰，與現有路由風格（`/pin`、`/move`、`/schedule`）一致。

### 6. Frontend Drawer UI

**選擇**：使用 shadcn/ui Sheet 元件（`npx shadcn@latest add sheet`）作為 Archive Drawer，搭配 Tabs 元件（`npx shadcn@latest add tabs`）。

**理由**：Snapshot dialog 使用 Dialog 是因為功能相對集中；Archive 清單可能有多筆項目，Drawer 模式提供更寬敞的空間，不阻擋看板主體操作。

## Risks / Trade-offs

- **封存期間 DeleteColumn 的卡片孤立問題** → `DeleteColumn` 的 cascade 刪除所有 cards（含已封存的），requirement 中「column 被刪除後 archive 卡片自動移除」因此自然滿足，無需額外處理。
- **Store 記憶體中的資料量增長** → 封存項目依然在 in-memory map 中，大量封存後記憶體使用量增加。預期使用情境（個人 Kanban）下不是問題；若有需求可在未來加入定期清理機制。
- **Snapshot 與封存狀態的互動** → Snapshot 是整個 workspace 的 JSON 快照，`ArchivedAt` 欄位會被完整記錄並在 restore 後還原。這是預期行為，無需特殊處理。

## Open Questions

（無）
