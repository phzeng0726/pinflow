# Spec: Delete Confirmation

## Purpose

為高風險刪除操作加入確認步驟，防止使用者誤刪重要資料。Board 與 Column 使用 AlertDialog，Checklist group 因位於 Dialog 內部改用 Popover，而輕量刪除操作（unpin、移除 tag 等）則維持一鍵直接執行。

## Requirements

### Requirement: 刪除 Board 前顯示 AlertDialog 確認
`BoardListPage` 中刪除 Board 的操作 SHALL 在執行前顯示 AlertDialog 確認框。使用者點擊刪除圖示時不得直接刪除，必須先確認。確認按鈕使用 `variant="destructive"` 樣式；取消按鈕關閉 Dialog 且不執行任何操作。

#### Scenario: 點擊刪除圖示開啟確認框
- **WHEN** 使用者點擊 Board 卡片右上角的刪除圖示
- **THEN** 顯示 AlertDialog，標題為 `confirm.deleteBoardTitle`，描述包含該 Board 的名稱

#### Scenario: 點擊取消不執行刪除
- **WHEN** 使用者在 AlertDialog 中點擊取消按鈕
- **THEN** AlertDialog 關閉，Board 未被刪除

#### Scenario: 點擊確認執行刪除
- **WHEN** 使用者在 AlertDialog 中點擊確認（Destructive）按鈕
- **THEN** 執行刪除 Board 的 mutation，AlertDialog 關閉

---

### Requirement: 刪除 Column 前顯示 AlertDialog 確認
`ColumnHeader` 的 DropdownMenu 中選擇 Delete 項目時 SHALL 顯示 AlertDialog 確認框，而非直接執行刪除。AlertDialog 顯示 Column 名稱及刪除後 Column 內所有 card 將一併刪除的警告。DropdownMenuItem 的 `onSelect` 必須呼叫 `e.preventDefault()` 以防止 DropdownMenu 關閉時觸發意外的 unmount。

#### Scenario: 選擇 Delete 選單項目開啟確認框
- **WHEN** 使用者在 Column 的選單中點擊 Delete
- **THEN** 顯示 AlertDialog，標題為 `confirm.deleteColumnTitle`，描述包含該 Column 名稱及 card 刪除警告

#### Scenario: 點擊取消不執行刪除
- **WHEN** 使用者在 AlertDialog 中點擊取消
- **THEN** AlertDialog 關閉，Column 及其 cards 未被刪除

#### Scenario: 點擊確認執行刪除
- **WHEN** 使用者在 AlertDialog 中點擊確認（Destructive）按鈕
- **THEN** 執行刪除 Column 的 mutation，AlertDialog 關閉

#### Scenario: DropdownMenu 不因 AlertDialog 開啟而異常關閉
- **WHEN** 使用者點擊 Delete 選單項目
- **THEN** AlertDialog 正常顯示且保持開啟，直到使用者主動確認或取消

---

### Requirement: 刪除 Checklist group 前顯示 Popover 確認
`ChecklistBlock` 中刪除 Checklist group 的圖示按鈕 SHALL 觸發 Popover 確認框，而非直接執行刪除。因 ChecklistBlock 位於 Card Detail Dialog 內部，確認元件 SHALL 使用 Popover（非 AlertDialog）以避免 z-index 與 focus trap 衝突。Popover 顯示確認文字與取消/確認兩個按鈕。

#### Scenario: 點擊刪除圖示開啟 Popover
- **WHEN** 使用者點擊 Checklist group 右側的刪除圖示
- **THEN** 顯示 Popover，包含 `confirm.deleteChecklistTitle` 文字及取消與刪除按鈕

#### Scenario: 點擊取消關閉 Popover 不刪除
- **WHEN** 使用者在 Popover 中點擊取消
- **THEN** Popover 關閉，Checklist group 未被刪除

#### Scenario: 點擊刪除執行並關閉 Popover
- **WHEN** 使用者在 Popover 中點擊刪除按鈕
- **THEN** 執行刪除 Checklist 的 mutation，Popover 關閉

---

### Requirement: 其他輕量刪除操作不加確認
以下操作 SHALL 維持一鍵直接執行，不加確認框：unpin card、從 card 移除 tag、移除 dependency 關係、移除 tag 顏色、刪除單一 checklist item。

#### Scenario: Unpin 操作直接執行
- **WHEN** 使用者點擊 unpin 按鈕
- **THEN** 立即執行 unpin，不顯示任何確認框

#### Scenario: 從 card 移除 tag 直接執行
- **WHEN** 使用者在 Card Detail 中點擊 tag 的移除圖示
- **THEN** 立即移除 tag，不顯示確認框
