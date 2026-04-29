## ADDED Requirements

### Requirement: Timeline 模式切換入口
BoardPage 右上角的模式切換 segmented control SHALL 包含第三個 Timeline 按鈕（使用 `GanttChartSquare` icon）。URL query param `view` SHALL 支援 `'board' | 'graph' | 'timeline'` 三個值，無效值 fallback 為 `'board'`。

#### Scenario: 切換至 Timeline 模式
- **WHEN** 使用者點擊 Timeline 按鈕
- **THEN** URL 更新為 `?view=timeline`，頁面顯示 TimelineView，Board 和 Graph 內容隱藏

#### Scenario: 直接開啟 Timeline URL
- **WHEN** 使用者直接導航至含 `?view=timeline` 的 board URL
- **THEN** 頁面直接顯示 Timeline 模式，不需額外操作

#### Scenario: 無效 view 參數 fallback
- **WHEN** URL 包含 `?view=invalid`
- **THEN** 系統 fallback 至 `view=board`，顯示看板模式

---

### Requirement: Timeline 基礎佈局
Timeline 主畫面 SHALL 採用 CSS Grid 佈局：左側固定 260px 標籤欄 + 右側可水平捲動甘特畫布；頂部 56px 日期標頭橫跨畫布寬度並水平同步捲動。左側標籤欄與右側畫布垂直捲動 SHALL 保持同步。

#### Scenario: 垂直捲動同步
- **WHEN** 使用者垂直捲動右側畫布
- **THEN** 左側標籤欄同步捲動至相同位置，無明顯延遲

#### Scenario: 水平捲動不影響左側
- **WHEN** 使用者水平捲動右側畫布
- **THEN** 左側標籤欄保持固定，只有日期標頭和甘特 bar 區域水平移動

---

### Requirement: 日期標頭顯示
日期標頭 SHALL 根據目前 zoom 模式顯示對應粒度：
- Day zoom：月份列 + 每日數字 + 星期縮寫（今日格以 accent 色底色標示）
- Week zoom：月份列 + 每週起始日（週一日期）
- Month zoom：年份列 + 月份縮寫

#### Scenario: Day zoom 日期標頭
- **WHEN** zoom 模式為 `day`
- **THEN** 標頭顯示月份橫跨列，下方每個欄格顯示日數字與星期縮寫；今日格有 accent 底色

#### Scenario: 今日標記
- **WHEN** 今日在可視範圍內
- **THEN** 畫布顯示垂直今日紅線，頂部有「TODAY」flag 標籤

---

### Requirement: 甘特 Bar 渲染
每張有 `endTime` 的卡片 SHALL 在畫布上渲染一個甘特 bar。Bar 的 `left` 與 `width` 根據日期與目前 zoom 的欄寬計算：
- 若卡片同時具備 `startTime` 與 `endTime`，`left` = startTime 距 rangeStart 的天數 × dayWidth，`width` = endTime - startTime 天數 × dayWidth（最小 1 格）
- 若卡片僅有 `endTime`（無 `startTime`），以「今天」作為推算起始日；若 endTime < today，則推算起始日為 endTime - 1 day

Bar 顏色 SHALL 對應所屬 Column；bar 內 SHALL 顯示卡片標題（overflow ellipsis）與 checklist 完成度（e.g., `3/8`）。Bar 點擊 SHALL 開啟 `CardDetailDialog`。

有 `endTime` 且無 `startTime` 的 bar（`isEndDateOnly: true`）SHALL 以斜線 stripe（`repeating-linear-gradient(135deg, transparent 4px, rgba(255,255,255,0.25) 4px 8px)`）疊加於藍色底色，以區分完整排程 bar。

#### Scenario: Bar 位置計算（完整排程）
- **WHEN** 卡片 startTime 為 2025-01-10，endTime 為 2025-01-20，zoom 為 day（28px/日）
- **THEN** bar width = (20-10) × 28 = 280px，left 對應 2025-01-10 的位置

#### Scenario: End-date-only bar 位置計算（today < endTime）
- **WHEN** 卡片無 startTime，endTime 為未來日期，今天為 2026-04-29，zoom 為 day
- **THEN** bar left 對應 2026-04-29，width = (endTime - today) × dayWidth（最小 1 格）

#### Scenario: End-date-only bar 位置計算（已過期）
- **WHEN** 卡片無 startTime，endTime 早於今天
- **THEN** bar left 對應 endTime - 1 day，width = 1 × dayWidth，顯示 overdue glow

#### Scenario: End-date-only bar 視覺樣式
- **WHEN** 渲染 isEndDateOnly 為 true 的 bar
- **THEN** bar 顯示藍色底色加斜線 stripe，視覺上可與完整排程 bar 區分

#### Scenario: Checklist progress overlay
- **WHEN** 卡片有 checklists，totalCount=8，completedCount=3
- **THEN** bar 內左側顯示 37.5% 寬度的半透明白色 progress overlay，bar 內顯示文字 `3/8`

#### Scenario: Overdue bar 樣式
- **WHEN** 卡片 endTime 早於今日且卡片未完成
- **THEN** bar 顯示紅色 border glow（`due-overdue` 樣式）

#### Scenario: Due soon bar 樣式
- **WHEN** 卡片 endTime 在今日起 5 天內（與 `getCardUrgency()` 門檻一致）
- **THEN** bar 顯示橘色 border glow（`due-soon` 樣式）

#### Scenario: 點擊 bar
- **WHEN** 使用者點擊甘特 bar
- **THEN** 開啟該卡片的 CardDetailDialog

---

### Requirement: 無排程卡片顯示
僅 **兩者皆無**（`startTime` 與 `endTime` 均未設定）或**僅有 `startTime`**（無 `endTime`）的卡片 SHALL 統一顯示於畫布底部「No dates」群組，以虛線框 bar 呈現（固定 120px 寬），不根據日期定位。僅有 `endTime` 的卡片 SHALL 進入主 lane（不歸入 "No dates"）。

#### Scenario: 無排程卡片群組
- **WHEN** 板子中有卡片未設定任何日期（startTime 與 endTime 皆為 null）
- **THEN** 這些卡片出現在所有有排程群組之後，群組標頭顯示「No dates」與計數

#### Scenario: 無排程 bar 樣式
- **WHEN** 渲染無排程卡片的 bar
- **THEN** bar 呈透明底色 + 虛線框，寬度固定 120px，使用 sticky 定位貼齊可視區域左緣，不顯示 progress overlay

#### Scenario: End-date-only 卡片不進入 No dates
- **WHEN** 卡片有 endTime 但無 startTime
- **THEN** 該卡片顯示於所屬 Column 的 lane 中（而非 "No dates" 群組），以 isEndDateOnly bar 渲染

---

### Requirement: Zoom 模式切換
Toolbar SHALL 提供 Day / Week / Month 三個 zoom 切換按鈕。切換後 bar 位置 SHALL 即時重新計算，不需重新載入資料。

#### Scenario: 切換 Zoom
- **WHEN** 使用者點擊 Week 按鈕（原為 Day）
- **THEN** 日期標頭單位變為週，所有 bar 的 left/width 依 72px/週重新計算，捲動位置盡量保持今日在視窗中

---

### Requirement: 分組模式切換
Toolbar SHALL 提供 Flat / By Status 兩個分組切換選項。

#### Scenario: Flat 模式
- **WHEN** groupBy 為 `flat`
- **THEN** 所有有排程卡片以單一清單顯示，依 column position 再依 card position 排序，底部接「No dates」群組

#### Scenario: By Status 模式
- **WHEN** groupBy 為 `by-status`
- **THEN** 卡片依所屬 Column 分組，每組顯示 lane 標頭（欄名 + 欄色 dot + 卡片計數），欄順序依 column position

---

### Requirement: 標題搜尋
Toolbar SHALL 提供搜尋輸入框，輸入後即時（無需按 Enter）篩選卡片。有搜尋詞時，標題不包含搜尋字串（大小寫不敏感）的卡片 SHALL 以低 opacity 顯示（黯淡），標題包含搜尋字串的卡片正常顯示。所有卡片保持在 DOM 中，不因搜尋而移除。若某 Column 下所有卡片均不匹配，lane 標頭列仍顯示（但其卡片均黯淡）。

#### Scenario: 搜尋時未匹配卡片黯淡
- **WHEN** 使用者在搜尋框輸入 `bug`
- **THEN** 標題不含 `bug`（不分大小寫）的卡片在左側 label 與右側 bar 上均以低 opacity 顯示；含 `bug` 的卡片以正常 opacity 顯示

#### Scenario: 搜尋時匹配卡片正常顯示
- **WHEN** 使用者在搜尋框輸入 `bug`
- **THEN** 標題含 `bug` 的卡片行正常顯示，不黯淡

#### Scenario: 清空搜尋
- **WHEN** 使用者清空搜尋框
- **THEN** 所有卡片恢復正常 opacity

---

### Requirement: 依賴關係箭頭顯示
畫布 SHALL 以 SVG elbow path 繪製卡片間的依賴關係線，從 from-card bar 右邊緣出發，折線至 to-card bar 左邊緣。線條顏色 SHALL 對應依賴型別（blocks=紅、parent_of=藍、related_to=綠虛線、duplicates=灰虛線）。

#### Scenario: All 模式顯示全部箭頭
- **WHEN** depMode 為 `all`
- **THEN** 所有通過 depTypeFilter 的依賴線以 opacity 0.75 顯示

#### Scenario: Off 模式不顯示箭頭
- **WHEN** depMode 為 `off`
- **THEN** 畫布不渲染任何 SVG 依賴線

#### Scenario: Hover 模式 — 有卡片被 hover
- **WHEN** depMode 為 `hover` 且使用者 hover 某張卡片
- **THEN** 僅渲染與該卡片直接相連（fromCard 或 toCard 為該卡片）的依賴線（opacity=1）；其餘所有依賴線不渲染（完全不存在於 DOM）

#### Scenario: Hover 模式 — 無卡片被 hover
- **WHEN** depMode 為 `hover` 且無卡片被 hover
- **THEN** 畫布不渲染任何依賴線

---

### Requirement: 依賴線型別篩選
Toolbar SHALL 提供篩選按鈕，點擊後顯示 filter panel。Filter panel SHALL 以每種依賴型別對應的 SVG 線條視覺（顏色、虛線樣式與實際渲染一致）呈現選項，而非 checkbox。Panel 頂部 SHALL 提供「Show All」與「Hide All」兩個快速按鈕。使用者可點擊任一型別 row 切換其顯示狀態。關閉某型別後，該型別的所有線條立即從畫布消失。Filter panel SHALL 僅在點擊 panel 外部（不含觸發按鈕本身）時關閉；點擊 panel 內部 SHALL 不關閉 panel。

#### Scenario: Filter panel 顯示線條視覺
- **WHEN** 使用者點擊 Toolbar 的篩選按鈕
- **THEN** 彈出 panel，每個依賴型別以 SVG 小線段（對應顏色與 strokeDasharray）呈現，而非 checkbox

#### Scenario: Show All
- **WHEN** 使用者點擊 panel 頂部「Show All」按鈕
- **THEN** 四種依賴型別全部啟用，畫布顯示所有通過型別篩選的依賴線

#### Scenario: Hide All
- **WHEN** 使用者點擊 panel 頂部「Hide All」按鈕
- **THEN** 四種依賴型別全部停用，畫布不顯示任何依賴線

#### Scenario: 切換單一型別
- **WHEN** 使用者點擊 `blocks` 型別 row（目前為啟用狀態）
- **THEN** `blocks` 型別停用，其線條從畫布移除，row 呈現黯淡狀態；其他型別不受影響

#### Scenario: 點擊 panel 內部不關閉
- **WHEN** 使用者在 filter panel 開啟時，點擊 panel 內部任何元素
- **THEN** panel 保持開啟，所點擊的操作（Show All / Hide All / 型別切換）正常執行

#### Scenario: 點擊外部關閉 panel
- **WHEN** filter panel 開啟時，使用者點擊 panel 和觸發按鈕以外的任何區域
- **THEN** panel 關閉

---

### Requirement: 回到今天
Toolbar SHALL 提供「Today」按鈕，點擊後畫布水平捲動至今日位置居中或靠左顯示。

#### Scenario: 點擊 Today 按鈕
- **WHEN** 使用者點擊 Today 按鈕
- **THEN** 畫布平滑捲動，今日紅線出現在可視區域左側約 1/4 處

---

### Requirement: 排程日期即時驗證
SchedulePopover 設定日期時，`startTime` 不得晚於 `endTime`；任一日期變更後須立即（非關閉時）驗證，違反時立即顯示錯誤訊息且不允許儲存。

#### Scenario: 設定 startTime 晚於已有的 endTime
- **WHEN** 使用者將 `startTime` 改為晚於現有 `endTime` 的時間
- **THEN** 立即顯示錯誤訊息（`schedule.endBeforeStart`），不等到關閉 Popover 才驗證

#### Scenario: 設定 endTime 早於已有的 startTime
- **WHEN** 使用者將 `endTime` 改為早於現有 `startTime` 的時間
- **THEN** 立即顯示錯誤訊息，且關閉 Popover 的動作被阻止（不呼叫 `updateSchedule.mutate`）

---

### Requirement: Row Hover 高亮
Timeline 中的每張卡片 SHALL 在鼠標移入其 row（左側 label 區或右側 bar 區）時，整條 row 顯示高亮背景色（含左側 label 區與右側畫布對應橫向區域）。移出後恢復正常背景。此行為與 depMode 和 searchQuery 狀態無關，始終啟用。

#### Scenario: 鼠標移入左側 label row 時高亮
- **WHEN** 使用者將鼠標移至某卡片的左側 label row
- **THEN** 該 row 的左側 label 區顯示高亮背景；右側畫布對應橫向區域同步顯示高亮背景

#### Scenario: 鼠標移入右側 bar 時高亮
- **WHEN** 使用者將鼠標移至某卡片的甘特 bar
- **THEN** 左側 label 區與右側對應 row 區域均顯示高亮背景

#### Scenario: 鼠標移出後恢復
- **WHEN** 使用者將鼠標移出 row
- **THEN** 高亮背景消失，恢復正常顯示
