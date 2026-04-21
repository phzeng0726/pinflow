## Why

使用者在 Pin 視窗中查看釘選卡片時，只能看到 checklist 的完成數量摘要，無法直接操作。此改動讓使用者不需打開卡片詳情，就能在 Pin 視窗中切換特定 checklist 並勾選 item，提升每日工作流程效率。

## What Changes

- `GET /api/v1/cards/pinned` 回應新增 `boardId` 欄位（供前端 query invalidation 使用）
- `PinnedCardItem` 的 checklist 摘要區塊改為可點擊，展開後顯示 checklist 選擇器與 item 列表
- item 列表唯讀（不可新增/編輯/刪除/拖曳），僅 checkbox 可操作（切換完成狀態）
- 預設選取第一個含有未完成 item 的 checklist；若全部已完成則選第一個

## Capabilities

### New Capabilities

- `pin-checklist-panel`：Pin 視窗小卡上的內嵌 checklist 面板，包含可展開的下拉選單與 item checkbox 操作

### Modified Capabilities

（無：`card-checklist` spec 的需求未變更；僅後端 DTO 新增欄位屬於實作細節）

## Impact

- **後端**：`backend/dto/card_dto.go`（`PinnedCardResponse` 加 `boardId`）、`backend/service/card_service.go`（`GetPinnedCards` 傳出 boardId）
- **前端型別**：`frontend/src/types/index.ts`（`PinnedCard` 加 `boardId`）
- **新前端元件**：`PinChecklistPanel`（`frontend/src/pages/pin/components/`）
- **新 Hook**：`usePinChecklistToggle`（`frontend/src/hooks/checklist/mutations/`）
- **修改元件**：`PinnedCardItem`（整合展開邏輯）
- **i18n**：`zh-TW.json` / `en-US.json` 新增 `pin.noChecklistItems`
