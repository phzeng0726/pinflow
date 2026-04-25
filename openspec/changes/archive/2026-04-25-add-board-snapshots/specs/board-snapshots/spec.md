## ADDED Requirements

### Requirement: Auto snapshot on destructive actions
系統 SHALL 在刪除 column 或刪除 card 的 API 請求成功執行之前，自動建立該 board 的快照（sync 模式），確保資料刪除前已備份。

#### Scenario: Auto snapshot before delete column
- **WHEN** `DELETE /api/v1/columns/:id` 被呼叫且 column 存在
- **THEN** 系統在刪除動作執行前建立一份 `trigger=delete_column`、`isManual=false` 的快照
- **THEN** 快照建立失敗時記錄 log 但不阻擋刪除操作（fail-open）

#### Scenario: Auto snapshot before delete card
- **WHEN** `DELETE /api/v1/cards/:id` 被呼叫且 card 存在
- **THEN** 系統在刪除動作執行前建立一份 `trigger=delete_card`、`isManual=false` 的快照

### Requirement: Auto snapshot on create/update with debounce
系統 SHALL 在 card / column 的新增或更新 API 請求成功回應後，以 debounce 模式非同步建立快照。同一 board 在 10 分鐘內若已有自動快照則 skip，不重複建立。

#### Scenario: Debounce skips snapshot within window
- **WHEN** `POST /api/v1/columns/:id/cards` 成功
- **AND** 該 board 最近一筆自動快照的 `createdAt` 在 10 分鐘以內
- **THEN** 系統跳過本次快照建立

#### Scenario: Debounce creates snapshot after window
- **WHEN** `POST /api/v1/columns/:id/cards` 成功
- **AND** 該 board 最近一筆自動快照的 `createdAt` 超過 10 分鐘或不存在
- **THEN** 系統非同步建立一份 `trigger=create_card`、`isManual=false` 的快照

#### Scenario: Failed mutation does not trigger snapshot
- **WHEN** 任何 mutation API 回應 HTTP 4xx 或 5xx
- **THEN** 系統不建立快照

### Requirement: Manual snapshot creation
使用者 SHALL 能夠透過 API 手動建立具名快照，此類快照永久保留不受 7 天清理策略影響。

#### Scenario: Create named manual snapshot
- **WHEN** `POST /api/v1/boards/:id/snapshots` 被呼叫，body 含 `name`
- **THEN** 系統建立 `isManual=true` 的快照並回傳快照 metadata
- **THEN** 快照 `name` 為使用者提供的字串

#### Scenario: Create unnamed manual snapshot
- **WHEN** `POST /api/v1/boards/:id/snapshots` 被呼叫，body 的 `name` 為空
- **THEN** 系統以 `snapshot-YYYYMMDD-HHmmss` 格式自動命名

### Requirement: List snapshots for a board
使用者 SHALL 能夠取得某 board 所有快照的清單，依建立時間倒序排列，手動快照標記區分。

#### Scenario: List returns all snapshots sorted by time
- **WHEN** `GET /api/v1/boards/:id/snapshots` 被呼叫
- **THEN** 回傳該 board 所有快照的 metadata 陣列，依 `createdAt` 倒序
- **THEN** 每筆包含 `id`、`name`、`isManual`、`trigger`、`createdAt` 欄位

#### Scenario: Empty list when no snapshots
- **WHEN** `GET /api/v1/boards/:id/snapshots` 被呼叫且該 board 無任何快照
- **THEN** 回傳空陣列

### Requirement: Restore board to snapshot
使用者 SHALL 能夠將整個 board 還原至指定快照的狀態。還原執行前系統 SHALL 自動建立「還原前快照」作為安全網。

#### Scenario: Restore creates pre-restore snapshot first
- **WHEN** `POST /api/v1/boards/:id/snapshots/:sid/restore` 被呼叫
- **THEN** 系統先建立 `trigger=restore`、`isManual=false`、`name=restore-before-{timestamp}` 的快照
- **THEN** 再執行還原，覆寫 board 的 JSON 檔及 in-memory state

#### Scenario: Restore replaces board content
- **WHEN** 還原成功完成
- **THEN** board 的 columns、cards、images 回到快照時的狀態
- **THEN** snapshot 中的 tags 被合併回 global tags（以 id 比對，不存在則重建）
- **THEN** snapshot 中的 dependencies 取代 global 中與此 board 相關的部分
- **THEN** `manifest.json` 的 `NextIDs` 更新為 `max(current, snapshot 最大 id + 1)`

#### Scenario: Restore fails gracefully
- **WHEN** 還原過程中發生錯誤
- **THEN** 回傳 HTTP 500，board 狀態盡可能維持原樣（pre-restore 快照可供手動補救）

### Requirement: Delete snapshot
使用者 SHALL 能夠刪除單筆快照，無論是手動或自動。

#### Scenario: Delete removes snapshot directory and index entry
- **WHEN** `DELETE /api/v1/boards/:id/snapshots/:sid` 被呼叫
- **THEN** 系統刪除 `.snapshots/snap-{sid}/` 目錄及 `index.json` 中的對應項目
- **THEN** 回傳 HTTP 204

#### Scenario: Delete non-existent snapshot
- **WHEN** `DELETE /api/v1/boards/:id/snapshots/:sid` 被呼叫但 sid 不存在
- **THEN** 回傳 HTTP 404

### Requirement: Automatic retention cleanup
系統 SHALL 在每次建立新自動快照時，自動清除 7 天前的舊自動快照；手動快照不受此規則影響。

#### Scenario: Old auto snapshots are cleaned up
- **WHEN** 系統建立新的自動快照
- **THEN** 系統掃描 `index.json`，刪除 `isManual=false` 且 `createdAt < now - 7d` 的快照（含目錄）
- **THEN** `isManual=true` 的快照不被刪除

#### Scenario: Manual snapshots are never auto-deleted
- **WHEN** 使用者手動建立的快照已超過 7 天
- **THEN** 系統不自動刪除該快照

### Requirement: Snapshot storage in workspace
快照 SHALL 儲存於 `boards/board-N/.snapshots/` 目錄下，隨 workspace 一起 Git 同步，格式為純 JSON 檔與原始圖片。

#### Scenario: Snapshot directory structure
- **WHEN** 任何快照被建立
- **THEN** 快照存放於 `boards/board-N/.snapshots/snap-{id}/`，包含 `meta.json`、`board.json`、`columns.json`、`cards/`、`images/`、`tags.json`、`dependencies.json`
- **THEN** `boards/board-N/.snapshots/index.json` 更新，包含所有快照的 metadata summary
