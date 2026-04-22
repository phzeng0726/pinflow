## Why

卡片之間已有依賴關聯（blocks、parent/child、related、duplicates），但目前只能在單張卡片的 detail dialog 中逐一查看，缺乏全局視野。Graph View 讓使用者能以節點圖形化方式一次看清整個看板的關聯網路，快速識別阻塞點、孤立任務與逾期風險。

## What Changes

- 看板 Header 新增 Board / Graph 切換鈕（segmented control），進入時預設 Board 模式
- 新增 Graph View 頁面區域，以 React Flow 節點圖呈現卡片與依賴關係
- 卡片節點顯示：欄位名稱 badge、標題、story point、priority、卡片編號、開始/結束日期、tags dots
- 卡片邊框依到期狀態著色：紅（逾期）、橘（5 天內）、藍（進行中）
- 4 種邊線樣式：blocks（紅實線）、parent/child（藍實線）、related（綠長虛線）、duplicates（灰短虛線）
- 點擊節點聚焦（高亮關聯卡片，淡化其餘）並顯示 Focus Banner
- 浮動工具列（即時更新）：標題搜尋、Hierarchy / Cluster 佈局切換、篩選（關係類型、欄位、日期、標籤）
- 底部浮動圖例，說明 4 種邊線含義
- 右下角縮放控制 + MiniMap 總覽小窗格
- 左側可收合 Dock：Unlinked Cards（無任何關聯）+ Needs Attention（逾期或 5 天內到期）
- 新增後端 API：`GET /api/v1/boards/:id/dependencies` 批次取得看板所有依賴，避免 N+1

## Capabilities

### New Capabilities

- `card-dependency-graph`: 圖形化卡片關聯視圖，含節點渲染、邊線樣式、聚焦模式、佈局算法、搜尋篩選、側邊欄 Dock、MiniMap、圖例，以及後端批次依賴查詢 API

### Modified Capabilities

<!-- 無現有 spec 需要修改 -->

## Impact

**後端**

- `backend/store/store.go`：新增 `ListDependenciesByBoard()`
- `backend/repository/repository.go` + `dependency_repository.go`：新增 `ListByBoard()` 介面與實作
- `backend/service/service.go` + `dependency_service.go`：新增 `ListByBoard()` 介面與實作
- `backend/api/dependency_handler.go`：新增 `ListBoardDependencies` handler
- `backend/api/router.go`：註冊 `GET /boards/:id/dependencies`

**前端**

- `BoardPage.tsx`：新增切換鈕 + 條件渲染 GraphView（最小變動）
- `frontend/src/pages/board-detail/components/graph/`：全新目錄，9 個新元件
- `frontend/src/hooks/dependency/`：新增 `useBoardDependencies.ts`、`useGraphData.ts`
- `frontend/src/stores/graphViewStore.ts`：新增 Zustand store（不持久化）
- `frontend/src/lib/api/dependencies.ts`：新增 `listBoardDependencies()`
- `frontend/src/hooks/queryKeys.ts`：新增 `dependencies.byBoard()`
- `frontend/src/locales/en-US.json` + `zh-TW.json`：新增 `graphView` 翻譯鍵

**共用工具修改**

- `frontend/src/lib/dates.ts`：`getScheduleUrgencyClass()` 中橘色門檻 `diff <= 3` → `diff <= 5`（全站統一為 5 天）

**新增依賴**

- `@xyflow/react` ^12.x（React Flow 圖形庫）
- `@dagrejs/dagre` ^1.x（Hierarchy 佈局算法）
