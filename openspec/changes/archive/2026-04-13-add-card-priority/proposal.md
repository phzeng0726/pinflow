## Why

卡片目前缺少優先度欄位，使用者無法快速分辨任務的緊急程度，導致看板上的工作排序全靠主觀感受或命名慣例。新增 Priority 欄位，讓使用者能以標準化的五級制明確標示每張卡片的重要性。

## What Changes

- 後端 Card model 新增選填欄位 `priority`（整數 1-5，null 代表未設定）
- PATCH `/api/v1/cards/:id` 支援更新 `priority`
- 所有 Card 回應 DTO 包含 `priority`
- 前端 CardDetailDialog 在 Story Points 與 Tags 之間新增 Priority 觸發按鈕
- 按下按鈕開啟 Popover，列出五個等級選項（Highest / Critical / High / Medium / Low）及 Remove 按鈕
- Priority 按鈕反映目前選定值（有值時顯示等級縮寫，無值時顯示 `+` 圖示）

## Capabilities

### New Capabilities

- `card-priority`: 卡片優先度欄位，包含後端儲存與 API 支援、前端 Popover 選擇 UI，以及 CardDetailDialog 整合

### Modified Capabilities

- `card-detail-dialog`: Dialog 新增 Priority 區塊（位於 Story Points 與 Tags 之間）

## Impact

- **後端：** `model/card.go`、`dto/`、`repository/`、`service/`、`api/` handlers，需重新執行 `swag init`
- **前端：** `types/`、`lib/api/cards.ts`、`hooks/card/mutations/`、`pages/board-detail/components/cards/` 相關元件
- **無 breaking change**（`priority` 為選填，預設 null）
