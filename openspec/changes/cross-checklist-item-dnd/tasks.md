## 1. Backend：DTO 與 Service

- [x] 1.1 在 `backend/dto/checklist_dto.go` 新增 `MoveChecklistItemRequest struct { ChecklistID uint \`json:"checklistId" binding:"required"\`; Position float64 \`json:"position" binding:"required"\` }`
- [x] 1.2 在 `backend/service/checklist_service.go` 新增 `MoveItem(id uint, req dto.MoveChecklistItemRequest)` 方法：透過 `itemRepo.FindByID` 取得 item，呼叫 `itemRepo.MoveItem` 執行搬移

## 2. Backend：Repository 搬移邏輯

- [x] 2.1 在 `backend/repository/checklist_item_repository.go` 新增 `MoveItem(itemID uint, targetChecklistID uint, position float64)` 方法
- [x] 2.2 `MoveItem` 實作：找到 item 所在的 card 與原 checklist，從原 checklist 的 items 移除 item，設定 `item.ChecklistID = targetChecklistID` 與 `item.Position = position`，加入目標 checklist 的 items，呼叫 `UpdateCard`
- [x] 2.3 既有 `Update` 方法保持不變（仍強制保留 `ChecklistID`）

## 3. Backend：Handler 與 Router

- [x] 3.1 在 `backend/api/checklist_item_handler.go` 新增 `MoveChecklistItem` handler，綁定 `MoveChecklistItemRequest`，呼叫 `service.MoveItem`
- [x] 3.2 在 `backend/api/router.go` 註冊 `PATCH /api/v1/checklist-items/:id/move`（放在 `/:id` 之前以避免路由衝突）
- [x] 3.3 為 handler 加上 Swagger godoc 註解
- [x] 3.4 執行 `cd backend && go build ./...` 確認編譯通過

## 4. Frontend：API 與 Mutation

- [x] 4.1 在 `frontend/src/lib/api/checklists.ts` 新增 `moveChecklistItem(id: number, data: { checklistId: number; position: number })`，呼叫 `PATCH /checklist-items/${id}/move`
- [x] 4.2 在 `frontend/src/lib/api/index.ts` 確認 re-export
- [x] 4.3 在 `frontend/src/hooks/checklist/mutations/useChecklistMutations.ts` 修改 `moveChecklistItem` mutation：mutationFn 改呼叫新的 `api.moveChecklistItem`，簽名改為 `{ id: number; checklistId: number; position: number }`
- [x] 4.4 將 `moveChecklistItem` mutation 改為樂觀更新模式：`onMutate` 做 cache snapshot + 樂觀更新，`onError` rollback，`onSettled` 延遲 invalidate

## 5. Frontend：useChecklistItemDnd 重寫

- [x] 5.1 修改 `frontend/src/hooks/checklist/useChecklistItemDnd.ts`，將參數 `checklist: Checklist` 改為 `checklists: Checklist[]`
- [x] 5.2 修改 `moveMutate` 簽名為 `(args: { id: number; checklistId: number; position: number }) => void`
- [x] 5.3 在 `handleDragEnd` 中，搜尋 over item 所在的 checklist（`overChecklist`）及 dragged item 的來源 checklist（`sourceChecklist`），支援 over 為 `checklist-item-placeholder` 類型（空 checklist drop zone）
- [x] 5.4 計算目標位置：在 `overChecklist.items` 中算出正確的 `midPosition`；若目標為空 checklist（placeholder），position 設為 1
- [x] 5.5 樂觀更新 cache：從 `sourceChecklist` 移除 item，加入 `overChecklist` 並帶入新 position（不論同群組或跨群組，統一處理）
- [x] 5.6 呼叫 `moveMutate({ id, checklistId: overChecklist.id, position })`

## 6. Frontend：ChecklistSection 提升 DndContext

- [x] 6.1 在 `frontend/src/pages/board-detail/components/checklists/ChecklistSection.tsx` 新增一個 item-level `DndContext`（id: `checklist-items-dnd-${card.id}`），包覆所有 `ChecklistBlock`，巢狀在既有的 block-level DndContext 內層
- [x] 6.2 在外層 block-level DndContext 的 `onDragStart` 中加入 type guard：若 `active.data.current?.type !== 'checklist'` 則 return，防止 item drag 冒泡觸發 block sorting
- [x] 6.3 在 ChecklistSection 呼叫 `useChecklistItemDnd`，傳入 `checklists: sortedChecklists` 與 `moveMutate`
- [x] 6.4 在 ChecklistSection 新增 item 的 `DragOverlay`，顯示被拖拉 item 的預覽（text + checkbox），activeItem state 由 `useChecklistItemDnd` 回傳

## 7. Frontend：ChecklistBlock 調整

- [x] 7.1 移除 `frontend/src/pages/board-detail/components/checklists/ChecklistBlock.tsx` 內部的 item `DndContext`（`id: checklist-items-dnd-${checklist.id}`）
- [x] 7.2 移除 ChecklistBlock 中的 `useChecklistItemDnd` 呼叫與相關 import
- [x] 7.3 保留 `SortableContext`（仍需讓 @dnd-kit 知道每個 checklist 內有哪些 sortable items）
- [x] 7.4 在 ChecklistBlock 的 item 列表為空時，渲染一個 `useDroppable` placeholder（`data: { type: 'checklist-item-placeholder', checklistId: checklist.id }`），作為空 checklist 的 drop target

## 8. 驗證

- [x] 8.1 執行 `cd backend && go build ./...` 確認後端編譯通過
- [ ] 8.2 啟動 dev server，手動測試同群組 item 拖拉排序正常
- [ ] 8.3 手動測試跨群組拖拉：item 移至目標 checklist 正確位置
- [ ] 8.4 手動測試拖拉 item 至空 checklist：item 正確出現在目標 checklist
- [ ] 8.5 重新整理頁面，確認資料已持久化
- [ ] 8.6 測試拖拉失敗時 UI 正確 revert（樂觀更新 rollback）
