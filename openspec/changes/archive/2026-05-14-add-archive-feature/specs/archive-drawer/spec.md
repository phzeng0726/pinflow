## ADDED Requirements

### Requirement: Open Archive Drawer from board header
使用者 SHALL 能夠從看板頁面開啟 Archive Drawer 查看所有封存項目。

#### Scenario: Archive button in board header
- **WHEN** 使用者在看板頁面，查看右上角工具列
- **THEN** 看板頁面 SHALL 顯示一個封存按鈕（Archive icon），位於 Snapshot 按鈕旁

#### Scenario: Open drawer
- **WHEN** 使用者點擊封存按鈕
- **THEN** Archive Drawer 從頁面右側滑出
- **THEN** Drawer 顯示 "Cards" 和 "Columns" 兩個 tab

### Requirement: Cards tab shows individually archived cards
Archive Drawer 的 Cards tab SHALL 顯示個別封存的卡片清單。

#### Scenario: Display archived cards list
- **WHEN** 使用者切換到 Cards tab
- **THEN** 顯示所有個別封存的卡片（archivedAt != null）
- **THEN** 每個項目顯示：卡片標題、所屬欄位名稱、封存時間（相對時間）
- **THEN** 清單按封存時間降序排列（最近封存的在最上方）

#### Scenario: Column archived indicator
- **WHEN** Cards tab 中某張卡片所屬的欄位已被封存
- **THEN** 顯示「欄位已封存」標示，讓使用者知道即使還原該卡片，也不會立即顯示在看板上

#### Scenario: Empty state
- **WHEN** 目前看板沒有任何個別封存的卡片
- **THEN** Cards tab 顯示空狀態提示文字

### Requirement: Columns tab shows archived columns
Archive Drawer 的 Columns tab SHALL 顯示封存的欄位清單。

#### Scenario: Display archived columns list
- **WHEN** 使用者切換到 Columns tab
- **THEN** 顯示所有已封存的欄位
- **THEN** 每個項目顯示：欄位名稱、卡片數量 badge、封存時間（相對時間）
- **THEN** 清單按封存時間降序排列

#### Scenario: Empty state
- **WHEN** 目前看板沒有任何封存的欄位
- **THEN** Columns tab 顯示空狀態提示文字

### Requirement: Restore and permanently delete from archive drawer
Archive Drawer 中的每個項目 SHALL 提供還原和永久刪除操作。

#### Scenario: Restore card from drawer
- **WHEN** 使用者點擊 Cards tab 中某張卡片的還原按鈕
- **THEN** 執行還原操作（邏輯詳見 card-archive spec）
- **THEN** 該卡片從 Cards tab 中消失
- **THEN** 顯示成功 toast 通知

#### Scenario: Restore column from drawer
- **WHEN** 使用者點擊 Columns tab 中某個欄位的還原按鈕
- **THEN** 執行還原操作（邏輯詳見 column-archive spec）
- **THEN** 該欄位從 Columns tab 中消失
- **THEN** 顯示成功 toast 通知

#### Scenario: Permanently delete card from drawer with confirmation
- **WHEN** 使用者點擊 Cards tab 中某張卡片的永久刪除按鈕
- **THEN** 顯示 AlertDialog 確認對話框
- **WHEN** 使用者確認
- **THEN** 執行永久刪除（邏輯詳見 card-archive spec）
- **THEN** 該卡片從 Cards tab 中消失

#### Scenario: Permanently delete column from drawer with confirmation
- **WHEN** 使用者點擊 Columns tab 中某個欄位的永久刪除按鈕
- **THEN** 顯示 AlertDialog 確認對話框，說明欄位及所有卡片將被永久刪除
- **WHEN** 使用者確認
- **THEN** 執行永久刪除（邏輯詳見 column-archive spec）
- **THEN** 該欄位從 Columns tab 中消失
