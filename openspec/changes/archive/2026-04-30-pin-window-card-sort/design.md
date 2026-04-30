## Context

PinWindow 目前以 `GET /api/v1/cards/pinned` 回傳的順序顯示卡片，用戶無法自訂排列。前端已安裝 `@dnd-kit/core` 與 `@dnd-kit/sortable`，並有多個成熟的 DnD hook 可參考（`useBoardListDnd`、`useBoardDetailDnd`）。`PinnedCard` 型別無 position 欄位，後端無對應排序 API。

## Goals / Non-Goals

**Goals:**
- PinWindow 卡片清單支援拖拉排序
- 排序在 app 重啟後仍保留（localStorage 持久化）
- 新釘選卡片附加至清單末尾（不影響既有順序）

**Non-Goals:**
- 後端儲存排序（不同裝置間不同步）
- 跨 BrowserWindow 即時同步排序（同一 app session 內共用 localStorage 即可）

## Decisions

### 1. 排序持久化：localStorage（非後端）

`PinnedCard` 無 position 欄位，新增後端 API 會增加不必要的複雜度。釘選順序屬於 UI 偏好，localStorage 在 Electron renderer 中完整可用。

- Key：`pinflow:pinOrder`（存 `number[]` card ID 陣列）
- 替代方案：Zustand store（但關窗即失；加 persist 中介層則等同 localStorage）

### 2. DnD 狀態管理：獨立 hook `usePinDnd`

仿照 `useBoardListDnd` 模式，將 sensors、排序邏輯、localStorage 讀寫封裝在單一 hook，使 `PinWindow.tsx` 保持清晰。

### 3. `useSortable` 置於 `PinnedCardItem` 內部

元件本身呼叫 `useSortable({ id: card.id })`，不需包裝元件。drag handle 使用 `GripVertical` icon（hover 時顯示），listeners 綁在 icon 上，其餘元件互動（Popover、按鈕）不受影響。

- 替代方案：外部 wrapper 元件（增加不必要層級）

### 4. DragOverlay：簡化預覽

DragOverlay 渲染輕量卡片（只顯示標題），不重用 `PinnedCardItem`（避免在 overlay 上下文呼叫 `useSortable`）。

## Risks / Trade-offs

- [localStorage 被清除] → 排序回到 API 預設順序，不影響功能，只是偏好遺失。可接受，無需緩解。
- [卡片解除釘選後 ID 殘留在 pinOrder] → `usePinDnd` 依 API 回傳卡片過濾，孤立 ID 自然忽略，不影響排序計算。
- [Popover/按鈕與 DnD 手勢衝突] → `PointerSensor` 使用 `distance: 5` 啟動門檻，點擊操作不會意外觸發拖曳。
