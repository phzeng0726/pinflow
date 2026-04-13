## Context

CardDetailDialog 的 metadata 列（Card Number / SP / Priority / Tags）已採用 popover 按鈕模式（`PriorityPopover`、`StoryPointPopover`、`TagsPopover`）。時程（Schedule）目前是一個獨立的 `ScheduleSection` 區塊，位於 metadata 列下方，視覺上與其他欄位分離、佔用過多空間。

現有 Radix UI Popover 元件與 `DateTimePicker`（自身也包含 Popover）已整合在專案中。

## Goals / Non-Goals

**Goals:**
- 新增 `SchedulePopover` 元件，採用與 `PriorityPopover` 一致的 Popover 按鈕模式
- 將 Schedule 移入 metadata 列，位於 Priority 與 Tags 之間
- 移除 `ScheduleSection` 元件

**Non-Goals:**
- 後端 API 或資料模型變更
- DateTimePicker 元件本身的功能修改
- 時區支援或其他日期格式

## Decisions

### 1. Nested Popover（SchedulePopover + DateTimePicker）

`DateTimePicker` 本身使用 Radix UI Popover。將兩個 `DateTimePicker` 放入 `SchedulePopover` 的 `PopoverContent` 形成巢狀 Popover。

**決定**：直接使用，Radix UI 的 Portal 機制讓內層 Popover 的點擊事件不會觸發外層關閉。

**替代方案**：將 Calendar UI 直接 inline 在 SchedulePopover 內容中（避免巢狀）。但這樣需要重複 DateTimePicker 的 UI 邏輯，維護成本高。

### 2. 儲存時機：關閉 Popover 時儲存

**決定**：Popover 關閉時（`onOpenChange(false)`）才呼叫 `updateCard.mutate`，僅在值有變動時送出。

**替代方案**：每次 DateTimePicker 變更立即儲存（每個日期欄位各一次 API call）。缺點：若使用者只是在兩個日期間切換調整，會觸發多餘 API 請求。

### 3. 驗證：end < start 時阻止關閉

**決定**：若 endTime 早於 startTime，顯示 error 訊息並阻止 Popover 關閉（不呼叫 mutate）。使用本地 useState 管理暫存值。

## Risks / Trade-offs

- **Nested Popover 焦點管理**：某些瀏覽器環境下巢狀 Popover 可能有焦點跳轉問題 → 以 Radix 預設行為處理，目前測試環境（Electron/Chromium）支援良好
- **Popover 寬度**：兩個 DateTimePicker 垂直排列需要足夠高度 → 使用 `w-72`，垂直 scroll 由 Popover 自然處理
