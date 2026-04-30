## 1. DnD Hook

- [x] 1.1 新增 `frontend/src/hooks/dnd/usePinDnd.ts`，實作 localStorage 讀寫（key: `pinflow:pinOrder`）、`sortedCards` 排序邏輯（pinOrder 排序 + 新卡片附加末尾）
- [x] 1.2 在 `usePinDnd` 實作 `handleDragStart`、`handleDragEnd`（`arrayMove` + 更新 state 與 localStorage）、`handleDragCancel`

## 2. PinnedCardItem 可拖曳化

- [x] 2.1 在 `PinnedCardItem.tsx` 引入 `useSortable({ id: card.id })`，將 `setNodeRef` 與 CSS transform/transition 套用到最外層 `<div>`
- [x] 2.2 加入 `GripVertical` drag handle icon，綁定 `attributes` 與 `listeners`；hover 時顯示，拖曳中降低卡片透明度（`isDragging`）

## 3. PinWindow DnD Context

- [x] 3.1 在 `PinWindow.tsx` 引入 `usePinDnd`，用 `sortedCards` 取代原本的 `cards` 渲染
- [x] 3.2 用 `DndContext`（sensors、事件處理器）+ `SortableContext`（`verticalListSortingStrategy`）包裹卡片清單
- [x] 3.3 加入 `DragOverlay` 顯示拖曳預覽（含卡片標題的輕量卡片）
