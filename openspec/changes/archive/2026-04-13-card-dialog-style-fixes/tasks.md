## 1. Dialog Header Fixed

- [x] 1.1 `CardDetailDialog.tsx`：`DialogContent` 加上 `flex flex-col overflow-hidden`，移除 `overflow-y-auto`
- [x] 1.2 `CardDetailDialog.tsx`：內容區 `<div className="p-6">` 改為 `<div className="flex-1 overflow-y-auto p-6">`

## 2. Tag Chip Clickable

- [x] 2.1 `TagsPopover.tsx`：新增 optional props `open?: boolean` / `onOpenChange?: (open: boolean) => void`，實作 controlled/uncontrolled 切換邏輯
- [x] 2.2 `CardDetailDialog.tsx`：新增 `tagsOpen` state，傳入 `<TagsPopover open={tagsOpen} onOpenChange={setTagsOpen} ...>`
- [x] 2.3 `CardDetailDialog.tsx`：每個 tag `<Badge>` 加上 `onClick={() => setTagsOpen(true)}` 及 `cursor-pointer`
- [x] 2.4 `CardDetailDialog.tsx`：tag 的 X `<button>` onClick 加上 `e.stopPropagation()`

## 3. Tag Chip Hover Opacity

- [x] 3.1 `CardDetailDialog.tsx`：有顏色的 Badge 加上 `transition-opacity hover:opacity-80`

## 4. Popover Header 統一

- [x] 4.1 `StoryPointPopover.tsx`：`PopoverContent` 改為 `p-0`，加 header div（border-b + "Story Points" + X 按鈕），原內容移至 `px-3 py-3`，新增 `X` import
- [x] 4.2 `PriorityPopover.tsx`：同上，header 標題為 "Priority"，新增 `X` import
- [x] 4.3 `SchedulePopover.tsx`：同上，header 標題為 "Schedule"，X 按鈕呼叫 `() => handleOpenChange(false)`
