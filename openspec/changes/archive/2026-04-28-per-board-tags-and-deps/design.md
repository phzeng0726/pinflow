## Context

PinFlow 的 Tags 與 Dependencies 目前以 workspace 全域檔案儲存（workspace 根目錄的 `tags.json` 與 `dependencies.json`），所有 board 共用同一份資料。Tag 沒有 `board_id` 欄位，Dependency 也沒有。這導致：

1. 使用者可以將 board A 的 tag 掛到 board B 的卡片上
2. 可以建立指向不同 board 卡片的 dependency
3. `GET /api/v1/tags` 回傳所有 board 的 tag，前端無法正確過濾

目標是在不引入資料庫的前提下，以純 JSON 檔案實現 per-board 隔離。

## Goals / Non-Goals

**Goals:**
- Tags 與 Dependencies 改存於 `boards/board-N/`，每個 board 完全隔離
- 建立跨 board 的 tag 關聯或 dependency 時，backend 回 422
- Per-board ID 計數器（每個 board 的 tag/dependency ID 從 1 開始）
- Snapshot 服務同步更新，直接從 per-board 檔案 copy / restore
- API 破壞性變更：`GET/POST /api/v1/tags` 改為 `GET/POST /api/v1/boards/:id/tags`
- 前端 tag picker 與 dependency 搜尋只顯示當前 board 的資料

**Non-Goals:**
- 自動 migration 現有資料（使用者處於開發階段，手動清理 JSON 檔）
- 支援 tag 在多 board 共享或繼承
- Cross-board dependency 的 legacy 相容模式

## Decisions

### 1. Per-board 檔案佈局

```
boards/board-N/
  board.json
  manifest.json    ← NEW：存放 tag/dependency ID 計數器
  columns.json
  tags.json        ← NEW
  dependencies.json ← NEW
  cards/
```

**理由**：所有 board 相關資料集中於同一目錄，刪除 board（`os.RemoveAll`）自動清理所有關聯資料，不需要額外的 cascade 邏輯。

### 2. 在 model 層新增 BoardID 欄位

`Tag.BoardID` 與 `Dependency.BoardID` 都加上去。

- **Tag.BoardID**：Tag 以 board 為命名空間，同名 tag 可在不同 board 獨立存在，`FindByName` 需要 board context 才能去重
- **Dependency.BoardID**：雖然 BoardID 可透過 `fromCardId → column → board` 推導，但明確存儲讓磁碟上的 JSON 自描述，`ListByBoard` 走 board index 而非全表掃描

### 3. Per-board ID 計數器（user 指定）

每個 board 自己的 `manifest.json`：
```json
{ "next_ids": { "tag": 1, "dependency": 1 } }
```

全域 `manifest.json` 繼續管理 `board`、`column`、`card`、`checklist`、`checklist_item`、`comment`、`snapshot`、`image` 等全域 ID。

`FileStore` 新增 `boardNextIDs map[uint]map[string]uint` 與 `NextBoardID(boardID, name)` 方法。

### 4. Snapshot 服務簡化

原本 `copyBoardToSnapshot` 從全域 tags 中過濾出「這個 board 用到的子集」。改為直接 copyFile：
- `boards/board-N/tags.json` → snapshot 目錄
- `boards/board-N/dependencies.json` → snapshot 目錄
- `boards/board-N/manifest.json` → snapshot 目錄

`mergeTags` 與 `restoreDependencies` 改為直接覆寫 per-board 檔案。`bumpNextIDs` 更新 board 的 `manifest.json`。

**Trade-off**：改動前產生的舊 snapshot 格式不相容（舊版存全域子集，新版存 per-board 完整檔案）。開發階段使用者可清除舊 snapshot，可接受。

### 5. API 破壞性變更：Tag List/Create

移除 `GET/POST /api/v1/tags`（全域路由），改為 `GET/POST /api/v1/boards/:id/tags`。

`PATCH /api/v1/tags/:id` 與 `DELETE /api/v1/tags/:id` 保留（tag ID 全域唯一，不需 boardId 定位）。

### 6. 卡片搜尋加 board 過濾

`GET /api/v1/cards/search?q=&board_id=` 新增可選 `board_id` 參數。Dependency 目標選擇的前端搜尋帶入當前 boardId，限制結果範圍。

## Risks / Trade-offs

- **舊 snapshot 不可還原** → 告知使用者在實作完成後清除舊 snapshots；開發階段可接受
- **前端 call site 漏改** → useTags() 若未更新為 useBoardTags(boardId) 會得到空陣列；實作後 grep 確認所有 call site
- **同名 tag 在同 board 去重** → CreateOrGet 需在 board 範圍內做 case-insensitive 去重（跨 board 不去重，允許獨立存在）
