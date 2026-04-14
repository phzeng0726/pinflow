## Why

CardDetailDialog 的視覺一致性與互動品質有幾處明顯落差：標題在滾動時會消失、Popover 樣式不統一、Tag 只能透過 + 按鈕開啟管理面板（不直覺）、hover 時顏色完全消失（體驗不佳）。這批修改統一修正上述問題，提升整體 UI 質感。

## What Changes

- **Dialog header 固定**：CardDetailDialog 的標題列（含卡片編號與關閉按鈕）固定在頂部，內容區域獨立滾動
- **Tag chip 可點擊**：CardDetailDialog 中已附加的 tag chip 點擊後等同點擊 + 按鈕，直接開啟 TagsPopover；chip 上的 X 移除按鈕須呼叫 `e.stopPropagation()` 防止事件冒泡至 chip 的 onClick
- **Tag hover 效果**：有顏色的 tag chip hover 時顯示輕微透明（`opacity-80`），而非完全移除顏色
- **Popover header 統一**：StoryPointPopover、PriorityPopover、SchedulePopover 的 header 樣式統一為與 TagsPopover 相同的風格（`border-b`、flex layout、標題 + X 關閉按鈕）

## Capabilities

### New Capabilities

（無新增 capability）

### Modified Capabilities

- `card-detail-dialog`：新增 tag chip 可點擊互動（點擊任一 tag chip 可開啟 TagsPopover），以及 dialog 標題固定的版面行為

## Impact

**修改的檔案：**
- `frontend/src/pages/board-detail/components/cards/CardDetailDialog.tsx`
- `frontend/src/pages/board-detail/components/cards/TagsPopover.tsx`（新增 controlled open/onOpenChange props）
- `frontend/src/pages/board-detail/components/cards/StoryPointPopover.tsx`
- `frontend/src/pages/board-detail/components/cards/PriorityPopover.tsx`
- `frontend/src/pages/board-detail/components/cards/SchedulePopover.tsx`

**無 API 變更、無新依賴、無 breaking changes。**
