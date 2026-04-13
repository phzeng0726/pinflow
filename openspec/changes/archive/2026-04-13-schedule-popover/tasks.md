## 1. 新增 SchedulePopover 元件

- [x] 1.1 建立 `SchedulePopover.tsx`，實作 popover 觸發按鈕（無日期顯示 Calendar icon；有日期顯示短格式摘要）
- [x] 1.2 實作 Popover 內容：開始時間與結束時間的 DateTimePicker 區段
- [x] 1.3 實作本地 state 管理（`startTime`/`endTime`），於 Popover 開啟時初始化
- [x] 1.4 實作關閉時儲存邏輯：值有變動才呼叫 `updateCard.mutate`，無變動直接關閉
- [x] 1.5 實作驗證：endTime 早於 startTime 時顯示 error 並阻止關閉
- [x] 1.6 實作「清除全部」按鈕：有任一日期時顯示，點擊後清空兩個欄位並關閉

## 2. 更新 CardDetailDialog

- [x] 2.1 在 metadata 列 Priority 與 Tags 之間加入 Schedule 欄位（label + `SchedulePopover`）
- [x] 2.2 移除 `<ScheduleSection>` 及其 import

## 3. 移除 ScheduleSection

- [x] 3.1 刪除 `ScheduleSection.tsx` 檔案
