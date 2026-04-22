## Context

PinFlow 的卡片依賴資料已存在（`dependencies.json`），以 `fromCardID → toCardID + type` 的結構儲存，type 分為 `blocks / parent_of / duplicates / related_to`。目前前端只能在單張卡片 detail dialog 逐一查看依賴，缺乏全局圖形化視圖。

現有資料取得方式：`GET /boards/:id` 回傳完整 board（含 dependencyCount），`GET /cards/:id/dependencies` 逐卡查詢完整依賴。若 Graph View 逐卡查詢，50 張卡片需 50 次 API，不可接受。

## Goals / Non-Goals

**Goals:**
- 以節點圖形化呈現整個看板的卡片關聯，一次 API 取得所有依賴
- 支援 Hierarchy（dagre 排版）和 Cluster（依欄位分組）兩種佈局
- 支援搜尋（標題）、篩選（關係類型/欄位/日期/標籤）、節點聚焦高亮
- 零侵入：不修改現有看板功能的行為與資料流
- 全站統一橘色到期門檻為 5 天

**Non-Goals:**
- Graph View 中不支援編輯卡片（無 dialog、無 context menu）
- 不支援在 graph 中直接建立或刪除依賴
- 不支援跨看板的關聯圖
- 不支援 Graph View 的持久化狀態（重新進入看板重置為 Board 模式）

## Decisions

### D1：圖形庫選擇 @xyflow/react (React Flow v12)

**選擇：** `@xyflow/react` + `@dagrejs/dagre`

**理由：**
- 自訂節點是純 React 元件，可直接使用 Tailwind + 現有 utility（`getPriorityConfig`、`getTagColorClasses` 等），無需另建樣式系統
- 內建 `MiniMap`、`Controls`（zoom/fit）、`Background`，省去自行實作 pan/zoom/minimap
- 自訂邊支援完整 SVG path 控制，四種線條樣式直接設定 `strokeDasharray` 和 `stroke` 顏色
- TypeScript 原生支援，v12 穩定 MIT 授權

**排除：**
- Cytoscape.js：Canvas-based，React wrapper 薄弱，HTML 節點難以用 Tailwind 樣式化
- 手刻 SVG：pan/zoom/minimap 建置成本等同整個功能的工作量

**React Flow CSS 引入位置：** 在 `GraphView.tsx` 頂層 `import '@xyflow/react/dist/style.css'`，避免污染全域樣式。若與 Tailwind reset 衝突，移至 `index.css` 加 scope。

---

### D2：後端批次依賴 API（新增 endpoint，不修改現有）

**選擇：** 新增 `GET /api/v1/boards/:id/dependencies`

**理由：**
- 不修改現有 `GET /boards/:id` response，零破壞性變更
- Store 已有 `columnsByBoard` 和 `cardsByColumn` reverse index，可快速建立 cardSet，再 O(n) 掃描 dependencies map
- 回傳格式複用現有 `DependencyResponse` DTO，無需新 DTO

**實作路徑：** Store → Repository interface → Repository impl → Service interface → Service impl → Handler → Router

---

### D3：Graph UI 狀態用 Zustand（不持久化）

**選擇：** 新建 `graphViewStore.ts`，不加 `persist` middleware

**理由：**
- 搜尋、篩選、聚焦、佈局模式等狀態在深層元件（節點、toolbar、sidebar）間共用，Zustand 避免 prop drilling
- 不持久化：Graph View 是「探索工具」，每次進入看板應回到乾淨狀態；`GraphView` unmount 時呼叫 `reset()`
- Board/Graph 切換狀態（`viewMode`）透過 URL search param（`?view=board|graph`）管理，由 TanStack Router 的 `validateSearch` 在 `routes/boards.$boardId.tsx` 定義；不使用 local state 或 store，以確保 URL 可書籤、重新整理不遺失模式

---

### D4：資料轉換邏輯集中於 `useGraphData` hook

**選擇：** 獨立 hook `frontend/src/hooks/dependency/useGraphData.ts`，純資料轉換，不含 UI

**理由：**
- board data 和 dependencies 各自有 TanStack Query cache，hook 以 `useMemo` 組合兩者
- 將 filtering、search dimming、focus dimming、layout 計算全部集中，`GraphView.tsx` 只負責組合
- 可獨立測試（mock board + dependencies → 驗證 nodes/edges 輸出）

**流程：**
```
board (useBoardDetail) + dependencies (useBoardDependencies)
  → 建立 cardMap (cardId → { card, column })
  → 篩選 dependencies（relation type / column / date / tag filters）
  → 標記 dimmed 節點（search query + focus mode）
  → 轉為 Node[] + Edge[]（帶 urgency status）
  → 執行 layout 算法（dagre 或 cluster grouping）→ 賦予 x, y
```

---

### D5：佈局算法

**Hierarchy（預設）：** dagre `rankdir: 'TB'`，節點尺寸 220×130。`blocks` 和 `parent_of` 邊加入 dagre graph 影響層級排版；`related_to` 和 `duplicates` 只渲染不影響排版。

**Cluster：** 依 `columnId` 分組，各組水平排列（組間 gap 80px），組內節點垂直堆疊（節點 gap 16px）。對應欄位的色塊使用 `getColumnColor()`。每次 `layoutMode` 或有效 `nodes` 改變時重新計算。

---

### D6：到期警告門檻統一為 5 天

**選擇：** 修改 `frontend/src/lib/dates.ts` 的 `getScheduleUrgencyClass()`，`diff <= 3` 改為 `diff <= 5`

**理由：** 用戶要求 Graph View 用 5 天門檻，且希望全站一致。此函式已被 `CardItem.tsx` 和其他地方使用，統一修改比各處獨立判斷更容易維護。

---

### D7：卡片節點「進行中」的定義

**規則：** `startTime` 已過（或等於今天）且 `endTime` 不存在，或 `endTime` 尚未逾期 → `due-inprog`（藍色邊框）

優先順序：`due-overdue` > `due-soon` > `due-inprog` > 無樣式（`getScheduleUrgencyClass` 已處理前兩者，進行中需額外判斷）

---

### D8：Unlinked cards 在 Graph 中的處理

**選擇：** Unlinked cards（`dependencyCount === 0`）**不出現在 Graph 主區域**，只列在左側 Sidebar 的 Unlinked section

**理由：** 無關聯的孤立節點在 graph 中無任何邊，dagre 排版效果差，且語意上屬於「待處理」的提示項目。Cluster 模式例外：顯示所有卡片（含 unlinked），以欄位分組呈現完整看板狀態。

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| 大量卡片（100+）時 dagre 排版慢 | React Flow viewport culling 只渲染可視節點；dagre 計算在 useMemo 內，依賴 nodes/edges 變化才重算 |
| React Flow CSS 與 Tailwind reset 衝突 | 若發生，將 `@xyflow/react/dist/style.css` 移至 `index.css` 並用 `.react-flow` scope 隔離 |
| `getScheduleUrgencyClass()` 改為 5 天影響現有 UI | 可接受：原 3 天只是初始值，5 天更符合實際需求。CardItem 的橘色警告時間拉長是有意為之 |
| 跨看板依賴（fromCard 屬於別的 board） | `ListDependenciesByBoard` 使用 OR 條件，跨看板依賴也會被包含。前端 `useGraphData` 中對 board 外的卡片，以 `DependencyCardRef.title` 顯示為簡化節點，標示為 `external: true` |

## Migration Plan

1. Backend 新增 endpoint（無破壞性，可安全部署）
2. Frontend 安裝新 package（`@xyflow/react`、`@dagrejs/dagre`）
3. 修改 `dates.ts` 門檻（全站生效，需 QA 確認 CardItem 橘色行為）
4. 新增所有 graph 元件（不影響現有 board 功能）
5. `BoardPage.tsx` 加切換鈕（最後一步，確認 graph 可用後再接入）

無需資料遷移或 rollback 策略（純新增功能）。

## Open Questions

- React Flow 的 `nodeTypes` 必須定義為模組層級常數（不可在 render 內定義），需確保不觸發不必要的 re-render。
- Cluster 模式的 group node 是否要用 React Flow 的 `parentId`（sub-flow 群組）或只是視覺背景 div？建議先用視覺背景 div，較簡單。
