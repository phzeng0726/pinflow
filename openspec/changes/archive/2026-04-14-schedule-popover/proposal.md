## Why

CardDetailDialog 的時程（Schedule）欄位目前以獨立區塊呈現在對話框內容區，與同一列的 Story Points、Priority、Tags 採用 popover 按鈕的風格不一致。將時程統一改為 popover 按鈕，使介面更緊湊、風格一致。

## What Changes

- 新增 `SchedulePopover` 元件，作為時程的 popover 觸發按鈕，放置於 metadata 列（Card Number / SP / Priority / **Schedule** / Tags）
- 觸發按鈕：無日期顯示 Calendar icon；有日期顯示短格式摘要（例如 `4/13 → 4/20`）
- Popover 內容：開始時間與結束時間的 DateTimePicker，附驗證（結束早於開始時不儲存並顯示 error）及「清除全部」按鈕
- 移除 `ScheduleSection` 元件及其在 `CardDetailDialog` 中的使用

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-detail-dialog`：時程編輯介面由獨立區塊改為 popover 按鈕，需更新 "Inline schedule editing in dialog" 需求描述

## Impact

- **修改**：`frontend/src/pages/board-detail/components/cards/CardDetailDialog.tsx`
- **新增**：`frontend/src/pages/board-detail/components/cards/SchedulePopover.tsx`
- **刪除**：`frontend/src/pages/board-detail/components/cards/ScheduleSection.tsx`
- 後端 API、schema、mutation hook 皆不受影響
