## Why

Timeline view 的初版實作在 5 個互動行為上與設計需求不符：dependency 篩選 popover 的視覺和操作均有問題、hover 模式的關聯線控制過於寬鬆、row hover 缺乏高亮回饋、搜尋結果直接隱藏卡片而非以黯淡方式保留。這些缺陷影響操作體驗，需在發布前修正。

## What Changes

- **Dependency 篩選 popover 改用線條視覺化**：每個依賴類型以 SVG 小線段（對應顏色與虛線樣式）取代 checkbox，並加入 Show All / Hide All 快速按鈕
- **修正 popover 點擊即關閉的 bug**：`data-filter-panel` 和 `data-filter-trigger` 屬性從未實際加到 DOM，導致外部點擊偵測誤判所有點擊為「外部」；補上這兩個屬性
- **Hover 模式只顯示 hover 中卡片的關聯線**：未 hover 時箭線全部隱藏；hover 某張卡片時，只顯示直接相關的箭線，其他箭線完全不 render
- **Row hover 全行高亮**：滑鼠移過任意卡片 row 時，左側 label 欄與右側 canvas 對應區域同步顯示背景高亮，提升可讀性
- **搜尋改為黯淡未匹配而非隱藏**：搜尋有輸入時，所有卡片保持顯示；未匹配的卡片（left panel row 和 bar）opacity 降低，匹配的卡片正常顯示

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `timeline-view`: 修改 dependency 篩選 UI、hover 模式關聯線行為、row hover 視覺回饋、搜尋結果顯示邏輯等需求行為

## Impact

**Frontend 元件**（均在 `frontend/src/pages/board-detail/components/timeline/`）：
- `TimelineFilterPanel.tsx` — 完整重寫 UI
- `TimelineToolbar.tsx` — 加 data attribute
- `TimelineArrows.tsx` — 修改 hover 模式渲染邏輯
- `TimelineLeftPanel.tsx` — 加 hover 高亮 + search dim
- `TimelineCanvas.tsx` — 加 row hover overlay 層
- `TimelineBar.tsx` — 加 hover 事件 + search dim

**Store / Data Hook**：
- `frontend/src/stores/timelineStore.ts` — 不變
- `frontend/src/pages/board-detail/components/timeline/useTimelineData.ts` — `CardRow` 加 `matchesSearch: boolean`，移除 search 過濾

**i18n**：
- `frontend/src/locales/en-US.json` — 加 `timeline.showAll`, `timeline.hideAll`
- `frontend/src/locales/zh-TW.json` — 同上（繁中）
