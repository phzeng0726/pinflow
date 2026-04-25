## Context

Timeline view 已實作並可運作，但有 5 個互動行為與使用者需求不符。所有修正均為純前端 React/Zustand 層面，不涉及後端 API 變更。現有架構（Zustand store `timelineStore`、`useTimelineData` hook、元件層 Canvas/LeftPanel/Bar/Arrows）保持不變，只針對問題點做最小化修正。

## Goals / Non-Goals

**Goals:**
- 修正 filter panel UI（視覺線條 + Show All/Hide All）
- 修正 filter panel 外部點擊誤關閉 bug
- 修正 hover 模式箭線邏輯（只顯示 hover 卡片的直接關聯線）
- 加入整 row hover 高亮（左側 label + 右側 canvas）
- 修正搜尋為黯淡模式（dim 未匹配，而非隱藏）

**Non-Goals:**
- 不新增 API 或後端功能
- 不更動 `timelineStore` 狀態結構
- 不修改其他 board 模式（board view、graph view）

## Decisions

### D1：Filter Panel 改用線條視覺化

**決策**：每個 dep type row 左側加一個 `<svg width="28" height="10">` 元素，以 `<line>` 繪製對應顏色和 `strokeDasharray`（來自 `getDependencyEdgeStyle(type)`）。取代 `<input type="checkbox">`。整個 row div 加 `onClick` 觸發 toggle，active 狀態用 row 的 opacity 區分（active=1, inactive=0.4）。

**理由**：讓使用者在篩選時就能看到每種線條的實際外觀，與 canvas 上的線條視覺一致，比 checkbox 更直觀。

**Show All / Hide All**：加在 panel 頂部，onClick 分別呼叫 `setDepTypeFilter(ALL_DEP_TYPES)` 和 `setDepTypeFilter([])`。

### D2：修正外部點擊偵測 bug

**決策**：
- `TimelineToolbar.tsx`：在 filter button 的外層 `<div className="relative">` 加 `data-filter-trigger` 屬性
- `TimelineFilterPanel.tsx`：在 container div 加 `data-filter-panel` 屬性

**理由**：`TimelineView.tsx` 的 `mousedown` handler 已正確實作，只是這兩個 data attribute 未被加到 DOM，導致所有點擊都被視為外部點擊。最小化修復。

### D3：Hover 模式箭線 — 直接跳過渲染

**決策**：移除 `getArrowOpacity()` 函式，改在 `filteredDeps.forEach` 迴圈中直接跳過不該顯示的箭線：
- `depMode === 'hover'` 且 `hoveredCardId === null` → 整個 SVG 不 render（早 return）
- `depMode === 'hover'` 且 card 被 hover → 只 render `fromCard.id === hoveredCardId || toCard.id === hoveredCardId` 的路徑

**替代方案**：用 opacity=0 隱藏。不採用原因：非相關箭線對讀者完全無意義，不 render 更乾淨且節省 DOM 節點。

### D4：Row Hover 高亮 — 雙側同步

**決策**：
- **左側**（`TimelineLeftPanel`）：card row div 加 `${isHovered ? 'bg-gray-100 dark:bg-gray-700/50' : ''}` class
- **右側**（`TimelineCanvas`）：在現有背景格線層之後，bars 層之前，加一組 `z-index: 0, pointer-events: none` 的 row-bg div，依 `hoveredCardId` 決定背景色
- **hover 觸發來源**：`TimelineBar` 的 bar div 加 `onMouseEnter/Leave`，因為 canvas 的鼠標事件實際落在 bar 上；`TimelineLeftPanel` 的 card row 已有 `onMouseEnter/Leave`

**理由**：`hoveredCardId` 已在 Zustand store，雙側都可讀取，不需額外 prop drilling。row-bg 用 `pointer-events: none` 避免攔截 bar 的 onClick。

### D5：搜尋結果 — 黯淡取代隱藏

**決策**：
- `useTimelineData.ts`：`CardRow` interface 加 `matchesSearch: boolean`；移除 `.filter(matchesSearch)` 從 rows 生成邏輯；改為 `rows.push({ kind: 'card', card, matchesSearch: matchesSearch(card) })`
- `TimelineLeftPanel`：讀 `searchQuery`（或直接用 `row.matchesSearch`），當 search 有輸入且 `!row.matchesSearch` 時加 `opacity-[0.15]`
- `TimelineBar`：接收 `matchesSearch: boolean` prop，當 search 有輸入且 `!matchesSearch` 時加 `opacity-[0.15]`
- `TimelineCanvas`：傳 `matchesSearch` 給 `TimelineBar`（從 row 取得）

**Lane count**：移除 search 過濾後，lane header 的 count 改為所有 scheduled 卡片數（不含 search 篩選），與顯示行為一致。

**替代方案**：在每個元件中直接從 store 讀 `searchQuery` 再計算 match。不採用原因：`CardRow` 加 `matchesSearch` 確保計算只在 `useTimelineData` 做一次，元件層不重複計算。

## Risks / Trade-offs

- **Row hover 雙側高亮**：左側 panel 和右側 canvas 是各自獨立的 scroll container，但因共用 `hoveredCardId` Zustand state，高亮可以同步。唯一風險是鼠標快速在兩區移動時 state 可能短暫不一致，影響可接受。
- **Search 改為 dim**：Lane header 的 count 不再反映「目前可見（有匹配）卡片數」，可能稍有歧義。影響輕微，保持 count = 總數更符合「所有卡片都存在，只是部分被淡化」的語意。
