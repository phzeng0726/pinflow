## ADDED Requirements

### Requirement: Archive entire column
使用者 SHALL 能夠封存整個欄位，將欄位及其所有卡片從看板視圖中隱藏。

#### Scenario: Archive column via header menu
- **WHEN** 使用者點擊欄位右上角的多功能按鈕並選擇「封存欄位」
- **THEN** 系統將該欄位標記為已封存（設定 archivedAt 時間戳）
- **THEN** 該欄位立即從看板消失（連同其所有卡片）
- **THEN** 顯示成功 toast 通知

#### Scenario: Archived column hidden from board view
- **WHEN** 已封存的欄位存在於系統中
- **THEN** 該欄位 SHALL NOT 出現在看板欄位列表中
- **THEN** 該欄位內的卡片 SHALL NOT 出現在看板上

#### Scenario: Archived column appears in Columns tab
- **WHEN** 使用者開啟 Archive Drawer 的 Columns tab
- **THEN** 已封存的欄位出現在清單中
- **THEN** 顯示欄位名稱、卡片數量與封存時間

### Requirement: Archive all cards in column
使用者 SHALL 能夠封存欄位內的所有卡片，而欄位本身仍保留在看板上。

#### Scenario: Archive all cards via column header menu
- **WHEN** 使用者點擊欄位右上角的多功能按鈕並選擇「封存所有卡片」
- **THEN** 系統將該欄位內所有未封存的卡片標記為已封存
- **THEN** 所有卡片從欄位中消失，欄位本身仍顯示於看板（變成空欄位）
- **THEN** 顯示成功 toast 通知

#### Scenario: Already archived cards not duplicated
- **WHEN** 使用者執行「封存所有卡片」，且欄位內已有部分個別封存的卡片
- **THEN** 僅封存尚未封存的卡片（已封存的不重複標記）

### Requirement: Restore archived column
已封存欄位 SHALL 能夠被還原到看板上。

#### Scenario: Restore column to board
- **WHEN** 使用者在封存清單中還原一個欄位
- **THEN** 該欄位 ArchivedAt 被清除
- **THEN** 該欄位出現在看板最右側（position 為目前最大值加一個單位）
- **THEN** 欄位內未個別封存的卡片一併顯示在看板上
- **THEN** 欄位內個別封存的卡片依然維持封存狀態，在 Cards tab 中可見
- **THEN** 顯示成功 toast 通知

### Requirement: Permanently delete archived column
已封存欄位 SHALL 能夠被永久刪除（含欄位內所有卡片）。

#### Scenario: Permanently delete column with confirmation
- **WHEN** 使用者點擊封存清單中某個欄位的永久刪除按鈕
- **THEN** 系統顯示確認對話框，說明欄位及所有卡片將被永久刪除，不可復原
- **WHEN** 使用者確認刪除
- **THEN** 該欄位及其所有卡片（含個別封存的卡片）從系統中永久移除
- **THEN** 顯示成功 toast 通知

#### Scenario: Individually archived cards also deleted
- **WHEN** 一個已封存欄位被永久刪除，且欄位內有個別封存的卡片
- **THEN** 這些個別封存的卡片 SHALL 一併從封存清單（Cards tab）中消失
