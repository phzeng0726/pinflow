## Context

PinFlow 的 board-detail 頁面已有 board（看板）和 graph（依賴圖）兩種模式，透過 URL query param `view` 切換，模式狀態不存放於 Zustand，只存在 URL。Timeline 模式需延續此設計，同時引入 Timeline 自身的 UI 狀態（zoom、groupBy、depMode 等）以 Zustand 管理。

現有可重用資源：
- `useBoardDetail(boardId)`：取板子含 columns + cards（有 `startTime`、`endTime`、`checklists`）
- `useBoardDependencies(boardId)`：取全部依賴
- `date-fns`：已安裝，用於所有日期計算
- `src/lib/dates.ts`：`getCardUrgency()`、`formatCardDate()` 等工具
- `src/lib/styleConfig.ts`：依賴線顏色設定（blocks=red, parent_of=blue, related_to=green, duplicates=gray）
- `GraphDependencyEdge.tsx`：SVG arrow marker 模式可參考

## Goals / Non-Goals

**Goals:**
- 以純 CSS absolute positioning + SVG 手刻甘特圖（不引入外部 Gantt 套件）
- 日期計算全面使用 `date-fns`
- 延續現有 board/graph 模式的架構模式（URL param、Zustand、自訂 Tailwind UI）
- 點擊 bar 開啟現有 `CardDetailDialog`
- 支援 dark mode

**Non-Goals:**
- 不支援拖拉調整 bar 長度（排程修改仍走 CardDetailDialog）
- 不新增後端 API
- 不支援列印 / 匯出

## Decisions

### D1：佈局策略 — CSS Grid + Absolute Positioning（不用 @xyflow/react）

**選擇**：CSS Grid `260px 1fr` 分割左側標籤欄與右側畫布；畫布內以 `position: absolute` 根據日期計算 left/width 定位 bar。

**理由**：`@xyflow/react` 是 node-graph 框架，不適合日期軸定位。參考 HTML 設計就是此架構，CSS 控制更精確，也符合現有 graph 元件「不用外部 Gantt 套件」的慣例。

**替代方案**：`gantt-task-react` — 基本功能有，但 hover/dim 依賴行為和 checklist progress 需大量 hack 內部，放棄。

---

### D2：日期計算 — date-fns

**選擇**：所有日期操作（differenceInDays、startOfWeek、eachDayOfInterval、addDays、startOfMonth 等）使用 `date-fns`。

**理由**：已安裝，型別安全，比手刻更可靠。

---

### D3：Zoom 欄寬

| Zoom  | dayWidth（px/day）| 欄單位 | 欄寬 |
|-------|------------------|--------|------|
| day   | 28               | 1 天   | 28 px（固定） |
| week  | 72 ÷ 7 ≈ 10.29   | 7 天（Mon–Sun）| 72 px（固定） |
| month | 3                | 1 曆月 | `daysInMonth × 3` px（可變） |

Bar 定位統一公式（所有 zoom）：
- `left` = `differenceInDays(rangeStart, card.startTime) × dayWidth`
- `width` = `differenceInDays(card.startTime, card.endTime) × dayWidth`，最小值為 `dayWidth`

Month zoom 的欄寬隨月份實際天數變化（一月 93 px、平年二月 84 px 等），真實反映時間比例；bar 與欄格天然對齊，無需特殊處理。若未來擴充 Year zoom，同理以 `daysInYear × dayWidth_year` 計算欄寬。

**日期範圍**：所有有排程卡片的最早 `startTime` 前 4 週 ～ 最晚 `endTime` 後 4 週（至少顯示 3 個月）。無任何有排程卡片時，以今天為中心顯示 3 個月。

---

### D4：依賴箭頭 — 手刻 SVG Elbow Path

**選擇**：`TimelineArrows` 元件以 SVG `<path>` 繪製 elbow 折線（from-bar 右邊緣 → 向右 12px → 垂直對齊 to-bar → to-bar 左邊緣），搭配 `<marker>` 定義箭頭。

**理由**：Gantt 圖依賴線是水平到垂直的 L 形轉折，不適合 GraphDependencyEdge 的 smooth step；手刻可精確控制 hover/dim 行為。線條顏色複用 `styleConfig.ts` 的設定。

**Hover/Dim 行為**：
- `depMode === 'hover'` 且 `hoveredCardId !== null`：只有與 hover 卡片直接相連的線和對應卡片列 opacity=1；其餘卡片列 opacity=0.15，線 opacity=0.1。
- `depMode === 'all'`：所有線 opacity=0.75，無淡化。
- `depMode === 'off'`：不 render SVG。

**虛線樣式**：`related_to`（`strokeDasharray: '12 6'`）、`duplicates`（`strokeDasharray: '4 4'`），與 Graph view 視覺語言一致。

---

### D5：Grouping

- **flat**：所有卡片單一清單，依 column position 再依 card position 排序
- **by-status**：依 Column 分組，每組前置 lane 標頭列（欄名 + 計數）；欄順序依 column position
- 無排程卡片永遠出現在底部「No dates」群組（兩種 grouping 皆適用）

---

### D6：Scroll 同步

左側標籤欄（垂直捲動）與右側畫布（垂直 + 水平捲動）共享同一 `scrollTop`，透過 `useRef` + `onScroll` 事件同步，避免雙 scrollbar 介面混淆。日期標頭與畫布水平捲動同步（同一個 scroll container 的 sticky header）。

---

### D7：State 管理

| 狀態 | 儲存位置 |
|------|---------|
| `view=timeline` | URL query param（同 board/graph） |
| zoom / groupBy / depMode / depTypeFilter / searchQuery / hoveredCardId / openedCardId / filterPanelOpen | `timelineStore.ts`（Zustand） |

---

### D8：無排程卡片

以虛線框 bar 顯示，固定寬度 120px，使用 `position: sticky; left: 4px; z-index: 1`，不根據日期定位，在水平捲動時始終貼齊可視區域左緣。顯示卡片標題即可，不顯示 checklist progress（無日期代表進度不具時序意義）。

---

### D9：Row Height 常數

**選擇**：所有 CardRow 與 LaneRow 高度統一為 `ROW_HEIGHT = 48 px`，定義於 `useTimelineData.ts` 並 export。

**理由**：左側標籤欄與右側畫布列高必須一致才能同步捲動。`TimelineArrows` SVG Y 座標計算依賴此常數：`y = rowIndex × ROW_HEIGHT + ROW_HEIGHT / 2`（取列中心）。

---

## Risks / Trade-offs

- **大量卡片效能**：所有 bar 以 absolute positioning 渲染，卡片過多（>200）時可能有 paint 效能問題。→ 目前不做虛擬化，後續可視需求加入 react-virtual。
- **SVG arrow 計算複雜度**：arrow 的 row index 需在 `useTimelineData` 中預先計算好，元件 render 時直接使用座標，避免 DOM 查詢。
- **Scroll sync 抖動**：瀏覽器不同的捲動處理可能造成左右面板短暫不同步。→ 使用 `requestAnimationFrame` 或直接操作 `scrollTop` 同步。
