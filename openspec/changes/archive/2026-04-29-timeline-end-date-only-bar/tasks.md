## 1. useTimelineData.ts 修改

- [x] 1.1 在 date-fns import 列表補上 `addDays`
- [x] 1.2 `BarProps` 介面新增 `isEndDateOnly: boolean` 欄位
- [x] 1.3 早期 fallback return（board 為 undefined 時）的 BarProps 補上 `isEndDateOnly: false`
- [x] 1.4 日期範圍計算：抽出 `endOnlyCards`，將其 endTime 納入 `endDates` 陣列（確保 end-only 卡片不落在可視區外）
- [x] 1.5 `getBarProps` 拆成 4 個 case（兩者皆無 / start+end / 只有 end / 只有 start），end-only 以 `addDays(end, -1)` 或 today 作為 inferredStart
- [x] 1.6 `isScheduled` 判斷改為 `!!card.endTime`，使 end-only 卡片進入主 lane

## 2. TimelineBar.tsx 修改

- [x] 2.1 解構 `barProps` 時補上 `isEndDateOnly`
- [x] 2.2 在 `!hasSchedule` 分支之後、正常 bar 分支之前，插入 `isEndDateOnly` 渲染分支：藍色底色 + 斜線 stripe + urgencyStyle + checklist 進度 overlay + 標題文字

## 3. 驗證

- [x] 3.1 建立只填 endTime（未來日）的卡片，確認 timeline 顯示帶斜線 stripe 的藍色 bar，且該卡片不在 "No dates" 群組
- [x] 3.2 建立只填 endTime（過去日）的卡片，確認 bar 寬度為 1 格且顯示 overdue glow
- [x] 3.3 確認兩者皆無的卡片仍在 "No dates" 群組
- [x] 3.4 確認完整排程（start+end）卡片的 bar 顯示不受影響
- [x] 3.5 執行 `pnpm test` 確認無 regression
