## Context

CardDetailDialog 是 PinFlow 的核心互動介面。目前有 4 個純 style/UX 問題需要修正：
1. 整個 dialog 一起滾動，header 會消失
2. Tag chip 只能透過 + 按鈕開啟 TagsPopover，不直覺
3. Tag chip hover 時顏色完全消失
4. SP / Priority / Schedule 的 popover 沒有統一 header，與 TagsPopover 樣式不一致

所有修改均為前端 UI 層，不涉及 API 或資料層。

## Goals / Non-Goals

**Goals:**
- Dialog header sticky，內容區獨立滾動
- Tag chip 點擊開啟 TagsPopover，X 按鈕不觸發
- Colored tag chip hover 顯示 `opacity-80`
- SP / Priority / Schedule popover 加上與 TagsPopover 一致的 header（`border-b` + 標題 + X 關閉按鈕）

**Non-Goals:**
- 不修改 backend API
- 不修改 TagsPopover 的功能邏輯
- 不改變 SP / Priority / Schedule 的 popover 內容或互動行為

## Decisions

### 1. Dialog sticky header：flex column layout

`DialogContent` 改為 `flex flex-col overflow-hidden`，header 保持原高度，內容區加 `flex-1 overflow-y-auto`。

**Why over alternatives:**
- `position: sticky` 在 overflow-y-auto 容器內需要額外條件，容易失效
- flex column 是 shadcn/ui Dialog 搭配 sticky header 的標準作法

### 2. Tag chip 開啟 TagsPopover：controlled open state

`TagsPopover` 新增 optional `open?: boolean` / `onOpenChange?: (open: boolean) => void` props。若未傳入，維持內部 state 行為（向後相容）。

`CardDetailDialog` 持有 `tagsOpen` state，傳給 `TagsPopover`，每個 tag chip 的 `onClick` 設為 `setTagsOpen(true)`。

**Why over alternatives:**
- 在 CardDetailDialog 內直接渲染多個 Popover trigger 會導致多個 Popover 存在，state 難以管理
- Controlled pattern 是 Radix UI Popover 的標準做法，`TagsPopover` 其他呼叫端不受影響

### 3. X 按鈕防止事件冒泡

Tag chip 的 X `<button>` 的 `onClick` 加上 `e.stopPropagation()`，確保移除 tag 時不會同時觸發 chip 的 onClick 開啟 TagsPopover。

### 4. Tag hover 效果：`hover:opacity-80`

在有顏色的 Badge 加 `hover:opacity-80 transition-opacity`。不使用 `hover:brightness-90` 因為 Tailwind v3 需額外設定 filter utilities。

### 5. Popover header 統一：移除 `p-3`，加 header div

SP / Priority / Schedule 的 `PopoverContent` 從 `p-3` 改為 `p-0`，新增與 TagsPopover 相同的 header 結構（`flex items-center justify-between border-b px-3 py-2`），原內容移至 `px-3 py-3` 的 content div。三個 popover 各需新增 `X` icon import。

## Risks / Trade-offs

- **TagsPopover controlled props**：`onOpenChange` 在 controlled 模式下需正確處理 `handleOpenChange` 邏輯（reset view/search）。解法：`handleOpenChange` 仍為內部函式，只是在 controlled 模式下同步呼叫外部 `onOpenChange`。
- **Badge hover 覆蓋**：shadcn Badge `secondary` variant 有預設 hover class，需確認 `cn()` 中的自訂 class 優先順序正確（`border-transparent text-white hover:opacity-80` 應覆蓋 variant 預設樣式）。
