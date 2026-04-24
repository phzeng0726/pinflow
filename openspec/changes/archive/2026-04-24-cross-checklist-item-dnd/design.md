## Context

目前每個 `ChecklistBlock` 組件內部建立獨立的 `DndContext`，導致 checklist item 只能在同一個 checklist 內排序。後端沒有 move endpoint，repository `Update` 方法強制保留原 `checklistId`，無法搬移 item 至不同 checklist。

## Goals / Non-Goals

**Goals:**
- 讓使用者可以將 checklist item 拖拉到不同的 checklist
- 後端新增獨立 `PATCH /api/v1/checklist-items/:id/move` endpoint，與既有 card move API（`/cards/:id/move`）結構對稱
- 同群組拖拉（排序）與跨群組拖拉（搬移）統一走 move endpoint
- 空 checklist 顯示 droppable placeholder，讓使用者可將 item 拖入空群組

**Non-Goals:**
- 跨 card 的 item 搬移

## Decisions

### 決定 1：新增獨立 move endpoint，不修改既有 PATCH API

**選擇**：新增 `PATCH /api/v1/checklist-items/:id/move`，接受 `MoveChecklistItemRequest { ChecklistID uint, Position float64 }`（皆必填）。既有 `PATCH /api/v1/checklist-items/:id`（text、completed、position）保持不變。

**理由**：與 `PATCH /api/v1/cards/:id/move`（`MoveCardRequest { ColumnID, Position }`）結構對稱，職責分明。Move 操作的必填欄位（目標 checklist + position）與一般 update 的 optional 欄位（text、completed）語意不同，拆開後 API 契約更清晰，既有呼叫完全不受影響。

**替代方案 A**：在既有 PATCH 加入 optional `checklistId *uint`。不需新 endpoint 但職責混合，且 repository `Update` 需額外判斷是否觸發搬移。
**替代方案 B**：在既有 PATCH 加入必填 `checklistId uint`。邏輯統一但破壞既有 API 契約。

---

### 決定 2：item DnD Context 提升至 ChecklistSection 層級

**選擇**：將 checklist item 的 `DndContext` 從各個 `ChecklistBlock` 移至 `ChecklistSection`，所有 ChecklistBlock 的 `SortableContext` 共用同一個父層 `DndContext`。

**理由**：@dnd-kit 的跨容器拖拉需要共用同一個 `DndContext`。將 context 提升後，item 可自由跨越不同 checklist 的 `SortableContext`，而 checklist block 的排序由外層獨立的 `DndContext` 處理，不互相干擾。

**替代方案**：在 ChecklistSection 用單一 DndContext 同時處理 checklist block 和 item 的排序，透過 `type` 欄位區分。此方案更簡潔但邏輯較複雜，容易混淆兩種拖拉行為。

---

### 決定 3：後端 repository 新增獨立 MoveItem 方法

**選擇**：在 `checklistItemRepository` 新增 `MoveItem(itemID uint, targetChecklistID uint, position float64)` 方法。此方法從原 checklist 移除 item，加入目標 checklist 並設定新 position，最後呼叫 `UpdateCard`。既有 `Update` 方法保持不變（仍強制保留 `ChecklistID`）。

**理由**：`UpdateCard` 已會自動重建 `itemToChecklist` index，不需額外處理。整張 card 的資料在同一個 JSON 檔案中，單次寫入即可完成搬移。獨立方法避免修改既有 `Update` 邏輯，降低迴歸風險。

## Risks / Trade-offs

- **DnD 架構巢狀複雜度增加**：ChecklistSection 現在有兩層 DndContext（外層處理 checklist block 排序、內層處理 item 排序），需確保事件不互相干擾。→ 透過 `data.type` 欄位（`'checklist'` vs `'checklist-item'`）嚴格區分；外層 `onDragStart` 檢查 `active.data.current?.type`，若非 `'checklist'` 則忽略，防止 item drag 冒泡觸發 block sorting。
- **空 checklist drop target**：空 checklist 需要顯示 droppable placeholder 作為 drop zone。→ 在 ChecklistBlock 的 item 列表為空時渲染一個 `useDroppable` placeholder，設定 `data.type: 'checklist-item-placeholder'` 與 `data.checklistId`，`handleDragEnd` 中判斷 over 為 placeholder 時，將 item 插入該 checklist 的 position 1。
- **樂觀更新跨 checklist**：跨群組時需同時更新兩個 checklist 的 items 陣列。→ 在 mutation 的 `onMutate` 中做樂觀更新（從 source 移除、加入 target），`onError` 時 rollback 至快照，`onSettled` 延遲 invalidate 確保最終一致。

## Migration Plan

無 breaking change，無需資料遷移。新增獨立 move endpoint，既有 PATCH API 與前端呼叫完全不受影響。
