## Why

目前 checklist item 的拖拉只能在同一個 checklist 內排序，使用者無法將 item 跨群組搬移，操作上只能刪除再重建，體驗不佳。

## What Changes

- 後端新增 `PATCH /api/v1/checklist-items/:id/move` endpoint，接受 `checklistId`（必填）與 `position`（必填），與既有 card move API 結構對稱
- 後端 repository 新增 `MoveItem` 方法支援將 item 從原 checklist 搬移到目標 checklist
- 前端 checklist item 的 DnD context 從 `ChecklistBlock` 層級提升至 `ChecklistSection` 層級，使 item 可跨群組拖拉
- 前端新增 `moveChecklistItem` API 呼叫與 mutation hook 對應新 endpoint
- 前端空 checklist 顯示 droppable placeholder，讓使用者可將 item 拖入空群組

## Capabilities

### New Capabilities
- `cross-checklist-item-dnd`: 支援 checklist item 跨群組拖拉，包含後端 move endpoint、前端 DnD 架構調整、空 checklist drop target

### Modified Capabilities

## Impact

- `backend/dto/checklist_dto.go` — 新增 `MoveChecklistItemRequest`
- `backend/service/checklist_service.go` — 新增 `MoveItem` 方法
- `backend/repository/checklist_item_repository.go` — 新增 `MoveItem` 方法支援跨 checklist 搬移
- `backend/api/checklist_handler.go` — 新增 `MoveChecklistItem` handler
- `backend/api/router.go` — 註冊 `PATCH /api/v1/checklist-items/:id/move`
- `frontend/src/lib/api/checklists.ts` — 新增 `moveChecklistItem` API 呼叫
- `frontend/src/hooks/checklist/mutations/useChecklistMutations.ts` — 新增 `moveChecklistItem` mutation（獨立於既有 `updateChecklistItem`）
- `frontend/src/hooks/checklist/useChecklistItemDnd.ts` — 重寫支援跨群組邏輯
- `frontend/src/pages/board-detail/components/checklists/ChecklistSection.tsx` — 新增 item DndContext
- `frontend/src/pages/board-detail/components/checklists/ChecklistBlock.tsx` — 移除內部 item DndContext
