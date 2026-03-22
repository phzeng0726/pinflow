## Why

Checklist 和 checklist item 目前在 UI 上無法拖拉調整順序，使用者只能依建立順序排列。此外，checklist item 的文字編輯需透過確認按鈕儲存，不如 checklist title 的 blur 自動儲存直覺。本次變更旨在提升 checklist 區塊的互動體驗。

## What Changes

- **Checklist DnD 排序**：在 card detail dialog 中，允許使用者透過拖拉調整 checklist 的順序
  - 後端 `Checklist` model 新增 `position` 欄位（float64）
  - 後端 `UpdateChecklist` API 擴充支援 `position` 更新
  - 前端 `ChecklistSection` 加入 `@dnd-kit/sortable` 支援
- **Checklist item DnD 排序**：在每個 checklist 內，允許使用者透過拖拉調整 item 的順序
  - 後端 `ChecklistItem` 已有 `position` 欄位，API 已支援 position 更新
  - 前端 `ChecklistBlock` 加入 `@dnd-kit/sortable` 支援
- **Checklist title / item blur 自動儲存**：
  - Checklist title 已有 `onBlur` handler，但點擊 dialog 遮罩關閉時不會觸發（dialog 直接 unmount），需修正
  - Checklist item 編輯目前使用確認按鈕，改為 blur 自動儲存模式
  - 修正 `CardDetailDialog`：關閉前先觸發 pending 的 blur 儲存（透過 `onInteractOutside` 或關閉前 flush 機制）

## Capabilities

### New Capabilities
- `checklist-dnd`: Checklist 與 checklist item 的拖拉排序功能（前後端）

### Modified Capabilities
- `card-checklist`: 新增 checklist position 欄位、checklist item blur 自動儲存行為

## Impact

- **Backend model**: `model/checklist.go` 新增 `Position` 欄位，需要 DB migration（GORM AutoMigrate）
- **Backend service/handler**: `UpdateChecklist` 擴充支援 `position` 參數
- **Backend DTO**: `UpdateChecklistRequest` 新增 `position` 欄位
- **Frontend types**: `Checklist` interface 新增 `position` 欄位
- **Frontend API**: `updateChecklist` 擴充支援 `position`
- **Frontend components**: `ChecklistSection`、`ChecklistBlock` 引入 `@dnd-kit/sortable`
- **Frontend dialog**: `CardDetailDialog` 需處理關閉前 flush inline 編輯
- **Frontend mutations**: `useChecklistMutations` 可能需新增 position 相關邏輯
- **Dependencies**: `@dnd-kit/sortable` 已在專案中（board DnD 使用），無需新增套件
