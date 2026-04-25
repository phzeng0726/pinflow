## 1. i18n — 新增翻譯 Key

- [x] 1.1 在 `frontend/src/locales/en-US.json` 的 `timeline` 區塊加入 `"showAll": "Show All"` 和 `"hideAll": "Hide All"`
- [x] 1.2 在 `frontend/src/locales/zh-TW.json` 的 `timeline` 區塊加入 `"showAll": "全部顯示"` 和 `"hideAll": "全部隱藏"`

## 2. 修正 Filter Panel — 視覺線條 + Show All/Hide All + data attribute

- [x] 2.1 重寫 `TimelineFilterPanel.tsx`：container div 加 `data-filter-panel`；頂部加 Show All / Hide All 按鈕（`setDepTypeFilter(ALL_DEP_TYPES)` / `setDepTypeFilter([])`）
- [x] 2.2 每個 dep type row 改用 `<svg width="28" height="10">` 繪製對應顏色與 `strokeDasharray` 的線條（來自 `getDependencyEdgeStyle(type)`），取代 `<input type="checkbox">`
- [x] 2.3 dep type row 以整個 div 的 `onClick` 觸發 toggle；active 狀態用 row opacity 表示（active=opacity-100，inactive=opacity-40）

## 3. 修正 Filter Panel 外部點擊關閉 bug

- [x] 3.1 在 `TimelineToolbar.tsx` 的 filter button 外層 `<div className="relative">` 加 `data-filter-trigger` 屬性

## 4. 修正 Hover 模式箭線邏輯

- [x] 4.1 在 `TimelineArrows.tsx` 中，`depMode === 'hover'` 且 `hoveredCardId === null` 時直接 `return null`（不渲染任何箭線）
- [x] 4.2 `depMode === 'hover'` 且有 hover 卡片時，只 render `fromCard.id === hoveredCardId || toCard.id === hoveredCardId` 的箭線（opacity=1），其餘直接 skip
- [x] 4.3 移除舊的 `getArrowOpacity()` 函式

## 5. Row Hover 高亮 — TimelineBar（右側觸發）

- [x] 5.1 在 `TimelineBar.tsx` 中從 `useTimelineStore` 讀取 `setHoveredCardId`
- [x] 5.2 在 bar 的主 div 加 `onMouseEnter={() => setHoveredCardId(card.id)}` 和 `onMouseLeave={() => setHoveredCardId(null)}`

## 6. Row Hover 高亮 — TimelineCanvas（右側背景）

- [x] 6.1 在 `TimelineCanvas.tsx` 中從 `useTimelineStore` 讀取 `hoveredCardId`
- [x] 6.2 在背景格線層之後、bars 層之前，為每個 card row 渲染一個 `pointer-events: none, z-index: 0` 的 row-bg div，當 `row.card.id === hoveredCardId` 時顯示 `bg-gray-100/70 dark:bg-gray-700/30` 高亮背景

## 7. Row Hover 高亮 — TimelineLeftPanel（左側背景）

- [x] 7.1 在 `TimelineLeftPanel.tsx` 的 card row div className 加入 `${isHovered ? 'bg-gray-100 dark:bg-gray-700/50' : ''}` 條件 class

## 8. 搜尋改為黯淡模式 — useTimelineData

- [x] 8.1 在 `useTimelineData.ts` 的 `CardRow` interface 加入 `matchesSearch: boolean` 欄位
- [x] 8.2 移除 `by-status` 分組中 scheduled 的 `.filter(matchesSearch)`；改為每個 card row 加 `matchesSearch: matchesSearch(card)`
- [x] 8.3 移除 `flat` 分組中的 `.filter(matchesSearch)`；同樣加 `matchesSearch` 到 card row
- [x] 8.4 移除「No dates」群組中的 `.filter(matchesSearch)`；同樣加 `matchesSearch` 到 card row
- [x] 8.5 Lane header 的 `count` 改為所有 scheduled 卡片數（不含 search 篩選）

## 9. 搜尋改為黯淡模式 — 元件層套用

- [x] 9.1 在 `TimelineLeftPanel.tsx` 讀取 `searchQuery`；當 `searchQuery.trim() !== ''` 且 `!row.matchesSearch` 時加 `opacity-[0.15]`（與現有 `isDimmed` 邏輯合併）
- [x] 9.2 在 `TimelineCanvas.tsx` 將 card row 的 `matchesSearch` 傳給 `TimelineBar` 作為 prop
- [x] 9.3 在 `TimelineBar.tsx` 接收 `matchesSearch: boolean`（預設 `true`）；讀取 `searchQuery`；當 search 有值且 `!matchesSearch` 時在 bar div 加 `opacity-[0.15]`
