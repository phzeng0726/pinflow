## Context

Card detail dialog 中的 checklist 區塊目前支援 CRUD 操作，但缺乏排序功能。Checklist item 已有 `position` 欄位（float64），但 checklist 本身沒有。Item 的文字編輯使用 form + 確認按鈕模式，與 checklist title 的 blur 自動儲存體驗不一致。

現有 DnD 基礎建設：
- `@dnd-kit/core` + `@dnd-kit/sortable` 已安裝
- Board level DnD（column、card）已透過 `useBoardDnd.ts` 實作，使用同步樂觀快取更新模式
- 位置計算使用 `midPosition()` 工具函式

## Goals / Non-Goals

**Goals:**
- Checklist 可在 card detail dialog 內拖拉調整順序
- Checklist item 可在同一 checklist 內拖拉調整順序
- Checklist title 和 checklist item 編輯均使用 blur 自動儲存，且點擊 dialog 遮罩關閉時也能正確儲存

**Non-Goals:**
- Checklist item 跨 checklist 拖拉（不在此次範圍）
- Checklist 跨 card 拖拉
- 鍵盤拖拉支援（可後續擴充）

## Decisions

### 1. Checklist model 新增 position 欄位

在 `model/checklist.go` 新增 `Position float64`，使用與 `ChecklistItem.Position` 相同的 float64 midpoint 策略。

**替代方案**：使用 integer 排序 — 不採用，因為 midpoint 模式已是專案慣例，避免每次 reorder 需要批次更新多筆記錄。

### 2. UpdateChecklist DTO 改用 pointer fields

`UpdateChecklistRequest` 需支援單獨更新 `title` 或 `position`，改為 pointer fields（`*string`, `*float64`），與 `UpdateChecklistItemRequest` 模式一致。binding tag 需移除 `required`，改用 service 層驗證。

### 3. Checklist DnD scope 獨立於 board DnD

Checklist DnD 在 card detail dialog（modal）內運作，與 board-level DnD 完全隔離。使用獨立的 `DndContext` + `SortableContext`，不影響現有 `useBoardDnd`。

**替代方案**：擴充 `useBoardDnd` 統一管理 — 不採用，因為 scope 完全不同（dialog vs. board），合併只會增加複雜度。

### 4. Checklist DnD 使用獨立 hook `useChecklistDnd`

新增 `hooks/checklist/useChecklistDnd.ts`，封裝 checklist + checklist item 的 DnD 邏輯。使用同步樂觀快取更新模式（與 `useBoardDnd` 一致）：先 `qc.setQueryData` 更新 card detail 快取，再呼叫 mutation。

### 5. Checklist item 編輯改為 controlled input + onBlur

移除 react-hook-form 的 `editForm`，改用 `useState` + `onBlur` 模式（與現有 checklist title 編輯方式一致）。移除確認按鈕（Check icon），改為 blur 或 Enter 自動儲存、Escape 取消。

**替代方案**：保留 react-hook-form + 加 onBlur — 不採用，因為單一欄位的 inline 編輯使用 useState 更簡單，與 checklist title 模式一致。

### 6. Dialog 關閉前 flush pending inline 編輯

Radix Dialog 點擊遮罩時直接觸發 `onOpenChange(false)` → component unmount，此時 input 的 `onBlur` 不會被觸發（或觸發時 component 已 unmount，mutation 無法執行）。

解法：在 `CardDetailDialog` 的 `DialogContent` 加上 `onInteractOutside` handler，在關閉前先將 focus 從 active element 移開（呼叫 `document.activeElement?.blur()`），讓 pending 的 onBlur handler 先執行完，再透過 `setTimeout` 延遲關閉。

**替代方案 A**：使用 `onOpenChange` 攔截 + `requestAnimationFrame` — 原理類似但更 hacky。
**替代方案 B**：使用 ref 追蹤 dirty state + 在 unmount 時 flush — 複雜度過高，且 unmount 時 mutation hook 可能已失效。

### 7. DnD Sensor 設定

使用 `PointerSensor` + `activationConstraint: { distance: 5 }`，與 board DnD 一致。在 dialog 中 `TouchSensor` 非必要但無害，暫不加入。

## Risks / Trade-offs

- **[Risk] Checklist position 欄位需 DB migration** → GORM AutoMigrate 會自動加欄位，既有 checklist 的 position 預設為 0。需在 service 層處理 position=0 的排序（可依 ID 排序作為 fallback）。
- **[Risk] Dialog 內 DnD 與背景 DnD 衝突** → Dialog 是 modal overlay，事件不會穿透，兩個 DndContext 自然隔離。
- **[Trade-off] Checklist item 不支援跨 checklist 拖拉** → 簡化實作，未來可擴充。每個 checklist 使用獨立 SortableContext。
