## ADDED Requirements

### Requirement: PinnedCardItem 顯示 board name
每張 PinnedCardItem SHALL 在 column name 左側顯示所屬 board 的名稱，格式為 `{boardName} / {columnName}`，讓用戶識別跨 board 的釘選卡片。

#### Scenario: 顯示 board name 與 column name
- **WHEN** Pin Window 載入釘選卡片清單
- **THEN** 每張卡片顯示 `{boardName} / {columnName}` 格式的位置資訊

#### Scenario: boardName 由後端 API 回傳
- **WHEN** 前端呼叫 `GET /api/v1/cards/pinned`
- **THEN** response 中每筆資料包含 `boardName` 欄位（字串）

### Requirement: PinnedCardItem column name 可點擊移動卡片
PinnedCardItem 的 column name SHALL 為可點擊元素；點擊後彈出 popover，列出同 board 所有 column，供用戶將卡片快速移動至目標 column 頂部。

#### Scenario: 點擊 column name 開啟 popover
- **WHEN** 用戶點擊 PinnedCardItem 中的 column name
- **THEN** 彈出 popover，列出同 board 的所有 column 名稱

#### Scenario: 目前所在 column 標示勾選
- **WHEN** column move popover 開啟
- **THEN** 目前卡片所在的 column 旁顯示勾選標記（check icon）

#### Scenario: 選擇不同 column 移動卡片
- **WHEN** 用戶在 popover 中選擇一個與目前 column 不同的 column
- **THEN** 卡片被移動至該 column 的頂部（position 0），popover 關閉，Pin Window 資料更新

#### Scenario: 選擇相同 column 不觸發移動
- **WHEN** 用戶在 popover 中點擊目前所在的 column
- **THEN** popover 關閉，不發送移動請求
