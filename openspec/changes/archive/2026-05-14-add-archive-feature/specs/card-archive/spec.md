## ADDED Requirements

### Requirement: Archive a single card
使用者 SHALL 能夠對單張卡片執行封存操作，將其從看板視圖中隱藏，但保留資料。

#### Scenario: Archive card via context menu
- **WHEN** 使用者右鍵點擊一張卡片並選擇「封存」
- **THEN** 系統將該卡片標記為已封存（設定 archivedAt 時間戳）
- **THEN** 該卡片立即從看板欄位中消失
- **THEN** 顯示成功 toast 通知

#### Scenario: Archived card hidden from board view
- **WHEN** 已封存的卡片存在於系統中
- **THEN** 該卡片 SHALL NOT 出現在看板欄位的卡片列表中

#### Scenario: Archived card hidden from search
- **WHEN** 使用者搜尋卡片
- **THEN** 已封存的卡片 SHALL NOT 出現在搜尋結果中

#### Scenario: Archived card hidden from pinned list
- **WHEN** 已封存的卡片原本為釘選狀態
- **THEN** 封存後該卡片 SHALL NOT 出現在釘選卡片清單中

### Requirement: Restore archived card to active column
已封存卡片 SHALL 能夠還原到看板上。

#### Scenario: Restore card whose column is still on board
- **WHEN** 使用者在封存清單中還原一張卡片，且該卡片所屬的欄位仍在看板上（未封存、未刪除）
- **THEN** 該卡片 ArchivedAt 被清除
- **THEN** 該卡片出現在原欄位的最上方（position 最小）
- **THEN** 顯示成功 toast 通知

#### Scenario: Restore card whose column is archived
- **WHEN** 使用者在封存清單中還原一張卡片，但該卡片所屬的欄位已被封存
- **THEN** 該卡片 ArchivedAt 被清除
- **THEN** 該卡片從 Cards tab 封存清單中消失
- **THEN** 該卡片依然不顯示於看板（因為所屬欄位仍為封存狀態）

#### Scenario: Card removed from archive when its column is deleted
- **WHEN** 封存卡片所屬的欄位被永久刪除
- **THEN** 該封存卡片 SHALL 從封存清單中消失（因 column 刪除時 cascade 刪除所有 cards）

### Requirement: Permanently delete archived card
已封存卡片 SHALL 能夠被永久刪除（不可復原）。

#### Scenario: Permanently delete with confirmation
- **WHEN** 使用者點擊封存清單中某張卡片的永久刪除按鈕
- **THEN** 系統顯示確認對話框，告知此操作不可復原
- **WHEN** 使用者確認刪除
- **THEN** 該卡片從系統中永久移除（含 images、dependencies）
- **THEN** 顯示成功 toast 通知

#### Scenario: Cancel permanent delete
- **WHEN** 使用者點擊封存清單中某張卡片的永久刪除按鈕
- **THEN** 系統顯示確認對話框
- **WHEN** 使用者取消
- **THEN** 卡片保持封存狀態，不被刪除
