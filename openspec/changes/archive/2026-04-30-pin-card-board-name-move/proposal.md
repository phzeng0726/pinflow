## Why

Pin Window 中的卡片可能來自不同 board，但目前只顯示 column name，用戶無法辨識卡片屬於哪個 board，也無法在不離開 Pin Window 的情況下快速將卡片移至同 board 的其他 column。

## What Changes

- `PinnedCardResponse` DTO 新增 `boardName` 欄位（後端）
- `PinnedCard` 前端型別同步新增 `boardName`
- PinnedCardItem 的 column name 左側新增 board name 顯示（格式：`{boardName} / {columnName}`）
- Column name badge 改為可點擊，點擊後彈出 popover 列出同 board 的所有 column，供用戶直接移動卡片

## Capabilities

### New Capabilities

- `pin-card-column-move`: PinnedCardItem 顯示 board name，並提供 column 移動 popover——點擊 column name 可將卡片移至同 board 任一 column 的頂部

### Modified Capabilities

（無需求層級異動）

## Impact

- **Backend**: `backend/dto/card_dto.go`（新增欄位）、`backend/service/card_service.go`（填充 boardName）
- **Frontend types**: `frontend/src/types/index.ts`（PinnedCard 介面）
- **Frontend UI**: `frontend/src/pages/pin/components/PinnedCardItem.tsx`（主要 UI 改動）
- **i18n**: `frontend/src/locales/zh-TW.json`、`en-US.json`（新增翻譯 key）
- **API**: `GET /api/v1/cards/pinned` response 新增 `boardName` 欄位（非 breaking，新增欄位）
