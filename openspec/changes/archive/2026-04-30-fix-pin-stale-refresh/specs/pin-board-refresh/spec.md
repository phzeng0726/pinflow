## ADDED Requirements

### Requirement: Snapshot restore invalidates pinned cards
還原 snapshot 成功後，系統 SHALL 立即 invalidate pinned cards 查詢，使 pin 視窗顯示還原後的最新資料。

#### Scenario: Restore snapshot refreshes pin window
- **WHEN** 使用者還原一個 snapshot
- **THEN** pin 視窗的 pinned cards 列表自動刷新，反映還原後的卡片狀態

### Requirement: Board delete invalidates pinned cards
刪除 board 成功後，系統 SHALL 立即 invalidate pinned cards 查詢，移除 pin 視窗中所有來自該 board 的過時卡片。

#### Scenario: Delete board clears its pinned cards from pin window
- **WHEN** 使用者刪除一個 board
- **THEN** pin 視窗不再顯示已刪除 board 的任何 pinned card

### Requirement: Column delete invalidates pinned cards
刪除 column 成功後，系統 SHALL 立即 invalidate pinned cards 查詢，移除 pin 視窗中所有來自該 column 的過時卡片。

#### Scenario: Delete column clears its pinned cards from pin window
- **WHEN** 使用者刪除一個 column
- **THEN** pin 視窗不再顯示已刪除 column 內的任何 pinned card

### Requirement: PinnedCardItem handles empty board columns defensively
`PinnedCardItem` 在讀取 `boardDetail.columns` 時 SHALL 做防禦性處理，當 columns 為 `undefined` 或 `null` 時回退為空陣列，不產生 runtime crash。

#### Scenario: Column popover renders safely when board has no columns
- **WHEN** pin 視窗顯示一張 pinned card，且該 card 的 board 目前沒有任何 column
- **THEN** column move popover 正常渲染（顯示空列表），不 crash

#### Scenario: deleteCard onMutate handles undefined columns safely
- **WHEN** 刪除卡片的 optimistic update 被觸發，且 board cache 中的 columns 為 undefined
- **THEN** onMutate 安全地回退為空陣列，不 crash
