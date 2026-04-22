## 1. Backend — Batch Dependencies API

- [x] 1.1 `backend/store/store.go`：新增 `ListDependenciesByBoard(boardID uint) []model.Dependency`，以 columnsByBoard + cardsByColumn 建 cardSet，O(n) 掃描 dependencies map
- [x] 1.2 `backend/repository/repository.go`：在 `DependencyRepository` interface 新增 `ListByBoard(boardID uint) ([]model.Dependency, error)`
- [x] 1.3 `backend/repository/dependency_repository.go`：實作 `ListByBoard()`，呼叫 `store.ListDependenciesByBoard()`
- [x] 1.4 `backend/service/service.go`：在 `DependencyService` interface 新增 `ListByBoard(boardID uint) ([]dto.DependencyResponse, error)`
- [x] 1.5 `backend/service/dependency_service.go`：實作 `ListByBoard()`，複用 `buildResponse()` 轉換 DTO，skip orphaned deps
- [x] 1.6 `backend/api/dependency_handler.go`：新增 `ListBoardDependencies` handler，含 Swagger godoc
- [x] 1.7 `backend/api/router.go`：在 boards group 新增 `boards.GET("/:id/dependencies", h.Dependency.ListBoardDependencies)`
- [x] 1.8 執行 `cd backend && swag init` 更新 Swagger docs
- [x] 1.9 執行 `cd backend && go build ./...` 確認編譯通過

## 2. Frontend — 共用工具修改

- [x] 2.1 `frontend/src/lib/dates.ts`：`getScheduleUrgencyClass()` 中 `diff <= 3` 改為 `diff <= 5`

## 3. Frontend — 基礎設施

- [x] 3.1 `frontend/package.json`：安裝 `@xyflow/react` 和 `@dagrejs/dagre`（`cd frontend && pnpm add @xyflow/react @dagrejs/dagre`）
- [x] 3.2 `frontend/src/lib/api/dependencies.ts`：新增 `listBoardDependencies(boardId: number)` 函式
- [x] 3.3 `frontend/src/hooks/queryKeys.ts`：新增 `dependencies.byBoard(boardId)` query key
- [x] 3.4 `frontend/src/hooks/dependency/queries/useBoardDependencies.ts`：新建 useQuery hook
- [x] 3.5 `frontend/src/stores/graphViewStore.ts`：新建 Zustand store（不含 persist），管理 `layoutMode`、`searchQuery`、`focusedCardId`、`sidebarOpen`、`filters`

## 4. Frontend — 資料轉換 Hook

- [x] 4.1 `frontend/src/hooks/dependency/useGraphData.ts`：新建 hook，接受 board + dependencies + store state，以 `useMemo` 輸出 `{ nodes: Node[], edges: Edge[] }`
- [x] 4.2 `useGraphData` 實作 cardMap 建立（cardId → { card, column }）
- [x] 4.3 `useGraphData` 實作依 relation type / column / date / tag 篩選 dependencies 和 nodes
- [x] 4.4 `useGraphData` 實作 search dimming（標題不符的節點標記 dimmed）
- [x] 4.5 `useGraphData` 實作 focus dimming（非聚焦卡片及其直接關聯以外的節點標記 dimmed）
- [x] 4.6 `useGraphData` 實作 Hierarchy 佈局（dagre `rankdir: TB`，`blocks`/`parent_of` 邊加入 dagre graph）
- [x] 4.7 `useGraphData` 實作 Cluster 佈局（依 columnId 分組，水平排列，組內垂直堆疊）
- [x] 4.8 `useGraphData` 實作卡片 urgency 判斷（overdue / due-soon / in-progress），5 天門檻

## 5. Frontend — 圖形元件

- [x] 5.1 `frontend/src/pages/board-detail/components/graph/GraphCardNode.tsx`：自訂 React Flow 節點，220px 寬，含 column badge、標題（max 2 行）、meta row（tags dots、priority、SP）、日期、#id、urgency 邊框（overdue/soon/inprog）、dimmed 狀態
- [x] 5.2 `frontend/src/pages/board-detail/components/graph/GraphDependencyEdge.tsx`：自訂 React Flow 邊，依 type 套用 4 種線條樣式（顏色 + strokeDasharray + 箭頭）
- [x] 5.3 `frontend/src/pages/board-detail/components/graph/GraphView.tsx`：主容器，組合 ReactFlow + nodeTypes + edgeTypes（模組層級常數）+ MiniMap + Controls，引入 `@xyflow/react/dist/style.css`
- [x] 5.4 `frontend/src/pages/board-detail/components/graph/index.ts`：barrel export `GraphView`

## 6. Frontend — UI 元件

- [x] 6.1 `frontend/src/pages/board-detail/components/graph/GraphToolbar.tsx`：浮動工具列（絕對定位 top-center），含搜尋輸入（debounce 300ms）、Hierarchy/Cluster 切換鈕（lucide 圖示）、篩選觸發按鈕
- [x] 6.2 `frontend/src/pages/board-detail/components/graph/GraphFilterPanel.tsx`：篩選下拉面板，含 relation type chips（附線條預覽 SVG）、欄位 chips（附色點）、日期範圍輸入、tag chips
- [x] 6.3 `frontend/src/pages/board-detail/components/graph/GraphLegend.tsx`：底部中央浮動圖例，4 種邊線樣式 + 標籤
- [x] 6.4 `frontend/src/pages/board-detail/components/graph/GraphSidebar.tsx`：左側 Dock（240px），Unlinked Cards + Needs Attention sections，可收合為 40px rail（數量 badge）
- [x] 6.5 `frontend/src/pages/board-detail/components/graph/GraphFocusBanner.tsx`：聚焦模式橫幅（toolbar 下方，絕對定位），顯示聚焦卡片標題 + Exit Focus 按鈕

## 7. Frontend — 整合 BoardPage

- [x] 7.1 `frontend/src/pages/board-detail/BoardPage.tsx`：新增 `viewMode` local state（`'board' | 'graph'`，預設 `'board'`）
- [x] 7.2 `BoardPage.tsx` Header：在 LocaleToggle 前插入 Board/Graph segmented toggle（lucide `LayoutGrid` / `GitBranch` 圖示）
- [x] 7.3 `BoardPage.tsx` 主區域：依 `viewMode` 條件渲染 DnD 欄位視圖或 `<GraphView boardId={id} />`

## 8. Frontend — i18n

- [x] 8.1 `frontend/src/locales/en-US.json`：新增 `graphView` 鍵（boardView、graphView、searchPlaceholder、hierarchy、cluster、filter、unlinkedCards、needsAttention、exitFocus、focusingOn、columns、relationTypes、dateRange、tags、clearFilters、overdue、dueSoon、inProgress，及 4 種 relation type 標籤）
- [x] 8.2 `frontend/src/locales/zh-TW.json`：新增對應中文翻譯

## 9. 驗證

- [x] 9.1 啟動 backend（`cd backend && go run . --workspace ../../pinflow-workspace`）確認 `GET /api/v1/boards/:id/dependencies` 可正確回傳
- [x] 9.2 啟動 frontend dev server（`cd frontend && pnpm dev`），進入含依賴關係的看板，切換 Graph 模式確認圖形渲染
- [x] 9.3 驗證 4 種邊線樣式正確顯示（顏色、虛線、箭頭）
- [x] 9.4 驗證卡片節點資訊欄位（column badge、標題、SP、priority、日期、tags dots、urgency 邊框）
- [x] 9.5 驗證搜尋：輸入關鍵字，非匹配節點即時淡化
- [x] 9.6 驗證篩選：關係類型、欄位、日期、標籤各項篩選生效，Clear Filters 重置
- [x] 9.7 驗證聚焦模式：點擊節點高亮關聯，Focus Banner 顯示，點擊 Exit 恢復
- [x] 9.8 驗證佈局切換：Hierarchy ↔ Cluster
- [x] 9.9 驗證 Sidebar Dock：Unlinked / Needs Attention 正確列出，收合/展開正常
- [x] 9.10 驗證 MiniMap 和 zoom 控制
- [x] 9.11 驗證 dark/light 主題切換在 Graph View 正常顯示
- [x] 9.12 驗證 CardItem 橘色到期警告改為 5 天後行為符合預期
