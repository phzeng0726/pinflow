## 1. Backend - Checklist position 支援

- [x] 1.1 在 `model/checklist.go` 新增 `Position float64` 欄位（gorm tag: `not null;default:0`）
- [x] 1.2 修改 `dto/checklist_dto.go`：`UpdateChecklistRequest` 改為 pointer fields（`Title *string`, `Position *float64`），移除 required binding；`ChecklistResponse` 新增 `Position float64`
- [x] 1.3 修改 `service/checklist_service.go`：`CreateChecklist` 自動指派 position（max + 1.0）；`UpdateChecklist` 支援 title 和 position 各自獨立更新；`ToChecklistResponse` 包含 position
- [x] 1.4 修改 `api/checklist_handler.go`：更新 UpdateChecklist handler 以配合新的 DTO 結構，加上至少一個欄位的驗證
- [x] 1.5 確保 `ListByCard` 回傳的 checklists 依 position 排序（repository 層加 `Order("position")`）
- [x] 1.6 更新 Swagger docs（`swag init`）
- [x] 1.7 新增或修改 backend tests 覆蓋：checklist position 建立、更新 position、更新 title only、排序順序

## 2. Frontend - 型別與 API 層更新

- [x] 2.1 在 `types/index.ts` 的 `Checklist` interface 新增 `position: number`
- [x] 2.2 修改 `lib/api/checklists.ts`：`updateChecklist` 支援 `{ title?: string; position?: number }` 參數

## 3. Frontend - Checklist title / item blur 自動儲存

- [x] 3.1 修改 `CardDetailDialog.tsx`：在 `DialogContent` 加上 `onInteractOutside` handler，關閉前先 `document.activeElement?.blur()` flush pending 的 inline 編輯，確保 checklist title 和 item 的 onBlur 儲存在 dialog 關閉時也能觸發
- [x] 3.2 修改 `ChecklistBlock.tsx`：移除 `editForm`（react-hook-form），改用 `useState` + `onBlur` 模式編輯 item text
- [x] 3.3 移除確認按鈕（Check icon），blur 或 Enter 時自動儲存（值有變化時），Escape 取消

## 4. Frontend - Checklist DnD 排序

- [x] 4.1 新增 `hooks/checklist/useChecklistDnd.ts`：封裝 checklist 排序的 DnD 邏輯（DndContext + SortableContext），包含同步樂觀快取更新
- [x] 4.2 修改 `useChecklistMutations.ts`：`updateChecklist` mutation 支援 position 參數
- [x] 4.3 修改 `ChecklistSection.tsx`：引入 DndContext + SortableContext，每個 ChecklistBlock 設為 sortable item，依 position 排序渲染
- [x] 4.4 修改 `ChecklistBlock.tsx`：加入 drag handle（GripVertical icon），套用 `useSortable` 的 attributes/listeners/transform/transition

## 5. Frontend - Checklist item DnD 排序

- [x] 5.1 在 `useChecklistDnd.ts` 中擴充 checklist item 的 DnD 邏輯，或在 `ChecklistBlock` 內建立獨立的 DndContext + SortableContext
- [x] 5.2 修改 `ChecklistBlock.tsx`：每個 checklist item 設為 sortable，加入 drag handle（GripVertical icon），依 position 排序渲染
- [x] 5.3 拖拉結束時使用 `midPosition()` 計算新 position，同步更新快取後呼叫 `updateChecklistItem` mutation

## 6. 驗證與測試

- [x] 6.1 手動測試：checklist DnD 排序、item DnD 排序、title/item blur 自動儲存（含 dialog 遮罩關閉）、Escape 取消
- [x] 6.2 確認 DnD 在 card detail dialog 內不影響 board-level DnD
- [x] 6.3 確認 mutation 失敗時 UI 正確回滾（cache invalidation）
