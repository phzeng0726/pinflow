## Why

CardDetailDialog 目前將 Story Point 按鈕格與 Tags 輸入區直接攤平在表單中，版面擁擠、操作流程散落，每次開啟卡片都需面對大量 UI 元素。需仿 Trello 改為「小標題 + 觸發鈕 → Popover」的收納式設計，讓主畫面保持乾淨。

## What Changes

- 移除 `StoryPointSelector` 元件，改為 `StoryPointPopover`：SP 值以單顆按鈕呈現，點擊後開 Popover 選值（含 REMOVE 功能）
- 移除 `TagSection` 元件，改為 `TagsPopover`：仿 Trello Labels Popover，支援搜尋、勾選 attach/detach、編輯（名稱、顏色）、刪除確認子畫面、新建 tag
- `CardDetailDialog` 主版面改為 SP 與 Tags 並排的「小標題 + 觸發鈕」群組
- 將 `TAG_COLORS` 與 `getTagColorClasses` 從 `ColorPicker.tsx` 抽出至 `tagColors.ts`，並刪除舊的 `ColorPicker` 元件、`TagSection`、`StoryPointSelector` 檔案

## Capabilities

### New Capabilities
- `story-point-popover`: 以 Popover 包裝 SP 選值介面，含數字按鈕格與 REMOVE；選值後自動關閉
- `tags-popover`: 以 Popover 包裝完整 Tags 管理介面，含 list / create / edit / delete-confirm 四個子畫面

### Modified Capabilities
<!-- 無現有 spec 需異動 -->

## Impact

- **修改檔案**
  - `frontend/src/pages/board-detail/components/cards/CardDetailDialog.tsx`（版面重構、替換 import）
  - `frontend/src/pages/board-detail/components/cards/CardItem.tsx`（更新 `getTagColorClasses` import 路徑）
- **新增檔案**
  - `frontend/src/pages/board-detail/components/cards/StoryPointPopover.tsx`
  - `frontend/src/pages/board-detail/components/tags/TagsPopover.tsx`
  - `frontend/src/pages/board-detail/components/tags/tagColors.ts`
- **刪除檔案**
  - `frontend/src/pages/board-detail/components/cards/StoryPointSelector.tsx`
  - `frontend/src/pages/board-detail/components/tags/TagSection.tsx`
  - `frontend/src/pages/board-detail/components/tags/ColorPicker.tsx`
- **依賴**：複用現有 `useCardMutations`、`useTags`、`useTagMutations`、shadcn Popover / Button / Input / Checkbox / Badge
- **無 API / 後端異動**
