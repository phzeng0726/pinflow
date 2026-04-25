## 0. 前置條件：排程驗證強化

- [x] 0.1 修改 `src/pages/board-detail/components/cards/SchedulePopover.tsx`：在 `handleStartTimeChange` 和 `handleEndTimeChange` 中即時驗證 `startTime <= endTime`；違反時立即 `setError(t('schedule.endBeforeStart'))`，不等關閉時才檢查（現有 close-guard 保留，補強為即時 feedback）

## 1. 路由與模式切換

- [x] 1.1 修改 `src/routes/boards.$boardId.tsx`：search validation 加入 `'timeline'`，無效值 fallback `'board'`
- [x] 1.2 修改 `src/pages/board-detail/BoardPage.tsx`：segmented control 加入 Timeline 按鈕（`GanttChartSquare` icon + Tooltip）
- [x] 1.3 修改 `BoardPage.tsx`：加入 `viewMode === 'timeline'` 條件 render `<TimelineView />`

## 2. Zustand Store

- [x] 2.1 建立 `src/stores/timelineStore.ts`，定義並 export：`zoom`（`'day'|'week'|'month'`，預設 `'week'`）、`groupBy`（`'flat'|'by-status'`，預設 `'by-status'`）、`depMode`（`'all'|'hover'|'off'`，預設 `'all'`）、`depTypeFilter`（`DependencyType[]`，預設全開）、`searchQuery`（string）、`hoveredCardId`（number|null）、`openedCardId`（number|null）、`filterPanelOpen`（boolean）及對應 setters

## 3. 資料處理 Hook

- [x] 3.1 建立 `src/pages/board-detail/components/timeline/useTimelineData.ts`
- [x] 3.2 實作日期範圍計算：掃描所有有排程卡片，取最早 startTime 前 4 週 ～ 最晚 endTime 後 4 週（最少 3 個月）；無排程卡片時以今天為中心顯示 3 個月
- [x] 3.3 定義並 export `ROW_HEIGHT = 48`（px）；定義 `dayWidth` 對應 zoom：`day=28`、`week=72/7`、`month=3`；Month zoom 每月欄寬 = `daysInMonth(month) × 3`（可變），用於 `TimelineDateHeader` 欄格渲染；計算 `dayCount`（總天數）
- [x] 3.4 實作 `getBarProps(card)`：`left = differenceInDays(rangeStart, card.startTime) × dayWidth`、`width = differenceInDays(card.startTime, card.endTime) × dayWidth`；`width` 最小值為 `dayWidth`（防止負值或零寬）
- [x] 3.5 實作 `rows` 生成：依 `groupBy` 和 `searchQuery` 組合 `LaneRow | CardRow` 陣列；未同時設定 `startTime` 與 `endTime` 的卡片固定放底部「No dates」群組；`by-status` 分組下搜尋後無卡片的 Column lane 自動隱藏
- [x] 3.6 實作 `filteredDeps`：依 `depTypeFilter` 過濾依賴列表
- [x] 3.7 實作 `rowIndexMap`（cardId → row index）供 TimelineArrows 計算 SVG Y 座標：`y = rowIndex × ROW_HEIGHT + ROW_HEIGHT / 2`

## 4. 主容器與 Toolbar

- [x] 4.1 建立 `TimelineView.tsx`：呼叫 `useBoardDetail`、`useBoardDependencies`、`useTimelineData`，組合所有子元件；監聽 `timelineStore.openedCardId`，渲染 `<CardDetailDialog />` 並在關閉時呼叫 `setOpenedCardId(null)`
- [x] 4.2 建立 `TimelineToolbar.tsx`：Zoom 切換按鈕（Day/Week/Month）、GroupBy 切換（Flat/By Status）、DepMode 切換（All/Hover/Off）、搜尋輸入框、Filter 按鈕、Today 按鈕
- [x] 4.3 建立 `TimelineFilterPanel.tsx`：絕對定位 dropdown，顯示 4 種依賴型別 checkbox（blocks / parent_of / duplicates / related_to）

## 5. 佈局 Grid 與 Scroll 同步

- [x] 5.1 建立 `TimelineGrid.tsx`：CSS Grid `260px 1fr`，管理 leftPanelRef 和 canvasRef，實作 `onScroll` 垂直同步（`requestAnimationFrame`）
- [x] 5.2 實作水平捲動：日期標頭與甘特畫布共享同一水平 scroll container

## 6. 日期標頭

- [x] 6.1 建立 `TimelineDateHeader.tsx`
- [x] 6.2 實作 Day zoom：用 `eachDayOfInterval` 產生每日格，顯示月份橫跨列 + 日數字 + 星期縮寫（`date-fns` format），今日格加 accent 底色
- [x] 6.3 實作 Week zoom：顯示月份列 + 每週起始日（週一）；所有 date-fns 的 startOfWeek / eachWeekOfInterval 呼叫須傳 `{ weekStartsOn: 1 }`
- [x] 6.4 實作 Month zoom：顯示年份列 + 月份縮寫；每月欄寬 = `daysInMonth(month) × dayWidth_month`（可變欄寬）
- [x] 6.5 渲染今日紅線（`.tl-today-line`）+ TODAY flag

## 7. 左側標籤欄

- [x] 7.1 建立 `TimelineLeftPanel.tsx`：依 `rows` 渲染 LaneRow（lane 標頭：欄色 dot + 欄名 + 計數）和 CardRow（卡片標題 + priority badge + checklist 計數），每列高度 `ROW_HEIGHT`
- [x] 7.2 每個 CardRow 的 hover 事件觸發 `setHoveredCardId`（mouse enter/leave）

## 8. 甘特 Bar

- [x] 8.1 建立 `TimelineBar.tsx`：接收 card + barProps，以 `position: absolute` 定位，列高 `ROW_HEIGHT`
- [x] 8.2 Bar 顏色對應 column 顏色（從 board.columns 取得，fallback 藍色）
- [x] 8.3 實作 checklist progress overlay（`position: absolute` 白色半透明，寬度 = completedRatio × barWidth）
- [x] 8.4 套用 urgency 樣式：直接呼叫 `getCardUrgency(card)`（門檻 5 天）；`'overdue'` 加紅色 border glow，`'due-soon'` 加橘色 border glow
- [x] 8.5 實作無排程卡片 bar：透明底色 + 虛線框 + 固定 120px 寬 + `position: sticky; left: 4px; z-index: 1`（水平捲動時貼齊可視左緣）
- [x] 8.6 點擊 bar 呼叫 `timelineStore` 的 `setOpenedCardId(card.id)`；Dialog 由 `TimelineView` 統一管理（見任務 4.1）

## 9. 背景格線與 Canvas

- [x] 9.1 建立 `TimelineCanvas.tsx`：包含背景格線（週末底色、week-start 分隔線）、today 紅線、`TimelineBar` × n、`TimelineArrows`
- [x] 9.2 實作週末底色（`date-fns` `isWeekend`）和週分隔線（`isMonday`）

## 10. 依賴箭頭

- [x] 10.1 建立 `TimelineArrows.tsx`：SVG `pointer-events: none`，絕對定位覆蓋整個 canvas
- [x] 10.2 定義 SVG `<marker>`：blocks（紅色實心箭頭）、parent_of（藍色實心箭頭）、related_to（綠色，無 marker，`strokeDasharray="12 6"`）、duplicates（灰色，無 marker，`strokeDasharray="4 4"`）；線條顏色複用 `styleConfig.ts`
- [x] 10.3 實作 elbow path 計算：from-bar 右邊緣 → 右移 12px → 垂直對齊 to-bar 中心（`rowIndex × ROW_HEIGHT + ROW_HEIGHT / 2`）→ to-bar 左邊緣（SVG `M L L L` path）
- [x] 10.4 實作 `depMode === 'all'`：全部線 opacity 0.75
- [x] 10.5 實作 `depMode === 'off'`：不 render SVG
- [x] 10.6 實作 `depMode === 'hover'`：無 hover 時全部線 opacity 0.25；有 hover 時相關線 opacity 1，其餘線 opacity 0.1
- [x] 10.7 搭配 TimelineLeftPanel 的 hover 狀態，無關卡片列套用 `opacity-[0.15]` class

## 11. Today 按鈕

- [x] 11.1 在 `TimelineToolbar.tsx` 的 Today 按鈕 onClick 中，計算今日對應的 `left` 像素值，呼叫畫布 ref 的 `scrollTo({ left: todayLeft - viewportWidth * 0.25, behavior: 'smooth' })`

## 12. Dark Mode 與樣式收尾

- [x] 12.1 確認所有新元件使用 Tailwind `dark:` 前綴支援深色模式
- [x] 12.2 確認 Timeline 頁面在 board/graph 模式切換後正確卸載（無 memory leak）
- [x] 12.3 確認 CardDetailDialog 在 Timeline 模式可正常開啟與關閉
- [x] 12.4 建立 `src/pages/board-detail/components/timeline/index.ts`，re-export `TimelineView`（對齊 graph 模式的 import 慣例：`import { TimelineView } from '@/pages/board-detail/components/timeline'`）
