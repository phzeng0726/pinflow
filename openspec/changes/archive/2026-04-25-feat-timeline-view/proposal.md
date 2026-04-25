## Why

PinFlow 目前提供看板（board）與依賴圖（graph）兩種瀏覽模式，缺乏以時間軸為主軸的視覺化工具，使用者無法直觀掌握卡片的排程分布、進度與依賴關係的時序影響。新增 Timeline（甘特圖）模式，讓有設定日期的卡片以時間條呈現，補全三種核心瀏覽維度。

## What Changes

- 新增第三個檢視模式 `timeline`，加入 BoardPage 右上角的模式切換 segmented control
- URL query param `view` 擴充支援 `'timeline'` 值
- 新增 Timeline 主畫面，包含：
  - 左側固定標籤欄（260 px）+ 右側可水平捲動的甘特畫布
  - 頂部日期標頭（月份列 + 日/週/月單位列），與畫布同步水平捲動
  - 甘特 bar：依卡片 `startTime`/`endTime` 定位，內含 checklist 完成度 progress overlay
  - 三種 zoom 模式：Day（28 px/日）、Week（72 px/週）、Month（90 px/月）
  - 兩種分組模式：Flat（單一清單）、By Status（依欄位分組顯示 lane 標頭）
  - 無排程卡片顯示於底部「No dates」群組，以虛線框 bar 表示
  - 依賴關係 SVG 箭頭，支援 All / Hover / Off 三種顯示模式
  - Hover 模式：hover 卡片時，相關依賴線與卡片高亮，其餘淡化至 opacity 0.15
  - 依賴線型別篩選面板（blocks / parent_of / duplicates / related_to 可獨立開關）
  - 標題搜尋（即時過濾卡片列）
  - Today 紅線標記 +「回到今天」按鈕

## Capabilities

### New Capabilities

- `timeline-view`：Board 第三種瀏覽模式，以甘特圖形式視覺化卡片排程、checklist 進度與依賴關係

### Modified Capabilities

（無，現有資料模型與 API 不需變更）

## Impact

- **修改**：`src/routes/boards.$boardId.tsx`（search validation 加入 `'timeline'`）
- **修改**：`src/pages/board-detail/BoardPage.tsx`（模式切換按鈕 + 條件 render）
- **新增**：`src/stores/timelineStore.ts`（Timeline 專用 Zustand store）
- **新增**：`src/pages/board-detail/components/timeline/`（10 個元件 + 1 個 data hook）
- **依賴套件**：`date-fns`（已安裝）用於所有日期計算；不引入新套件
- **不影響**：Backend API、資料模型、其他頁面、Board / Graph 模式
