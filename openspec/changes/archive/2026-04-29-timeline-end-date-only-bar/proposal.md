## Why

Timeline 目前只渲染同時具備 `startTime` 與 `endTime` 的卡片進度條；只設了 `endTime`（截止日）的卡片會被歸入 "No dates" 群組並顯示為無意義的虛線框，使使用者無法在 timeline 上看到截止日的位置，失去時間管理的參考價值。

## What Changes

- `getBarProps` 邏輯拆成四個 case，新增「只有 endTime」的處理分支：以今天作為推算起始日，計算出有效的 `left` 與 `width`
- `BarProps` 介面新增 `isEndDateOnly: boolean` 欄位，用於 TimelineBar 渲染時的視覺區分
- `isScheduled` 判斷改為 `!!card.endTime`，使只有截止日的卡片進入主 lane 而非 "No dates" 群組
- 日期範圍計算納入 end-only 卡片的 `endTime`，確保其不落在可視區外
- `TimelineBar` 新增 `isEndDateOnly` 渲染分支：藍色底色 + 斜線 stripe，視覺上可與完整排程卡片區分

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `timeline-view`：卡片的顯示條件從「需要 start+end」放寬為「有 end 即可顯示 bar」；新增 end-only bar 的視覺規格

## Impact

- `frontend/src/pages/board-detail/components/timeline/useTimelineData.ts`
- `frontend/src/pages/board-detail/components/timeline/TimelineBar.tsx`
- 不影響後端 API、資料結構或其他前端頁面
