## 1. 抽出顏色共用模組

- [x] 1.1 新增 `frontend/src/pages/board-detail/components/tags/tagColors.ts`，export `TAG_COLORS` 與 `getTagColorClasses`（從 `ColorPicker.tsx` 搬移）
- [x] 1.2 更新 `frontend/src/pages/board-detail/components/cards/CardItem.tsx`，將 `getTagColorClasses` import 路徑改為 `@/pages/board-detail/components/tags/tagColors`

## 2. StoryPointPopover

- [x] 2.1 新增 `frontend/src/pages/board-detail/components/cards/StoryPointPopover.tsx`
- [x] 2.2 實作觸發鈕：有值顯示藍底數字，無值顯示 `+` icon（outline）
- [x] 2.3 實作 popover 內容：標題 "Story Points"、數字格按鈕（`STORY_POINTS = [1,3,5,7,9,11,13,15,17,19]`）、選中態藍底樣式
- [x] 2.4 實作選值邏輯：點擊數字呼叫 `updateCard`（選同一值 → `storyPoint: 0`），選後關閉 popover
- [x] 2.5 實作 REMOVE 鈕：僅在有值時顯示，點擊呼叫 `updateCard({ storyPoint: 0 })`，關閉 popover

## 3. TagsPopover — 基礎架構

- [x] 3.1 新增 `frontend/src/pages/board-detail/components/tags/TagsPopover.tsx`
- [x] 3.2 定義 `view` state 型別：`'list' | 'create' | { mode: 'edit'; tag: Tag } | { mode: 'delete-confirm'; tag: Tag }`
- [x] 3.3 實作 `+` 觸發鈕（PopoverTrigger）與 Popover 骨架

## 4. TagsPopover — list view

- [x] 4.1 實作標題列（"Tags" + X 關閉鈕）
- [x] 4.2 實作 search input，即時過濾 `allTags`（case-insensitive）
- [x] 4.3 實作 tag 列表：Checkbox（勾選 = attached）、色塊 bar（寬滿 + tag 名）、Pencil icon 按鈕
- [x] 4.4 Checkbox 切換時呼叫 `attachTag` / `detachTag`
- [x] 4.5 Pencil 按鈕切換至 `view = { mode: 'edit', tag }`
- [x] 4.6 實作底部 "Create a new tag" 按鈕，切換至 `view = 'create'`

## 5. TagsPopover — create / edit view

- [x] 5.1 實作標題列：`<` 返回鈕 + 標題（"Create tag" / "Edit tag"）+ X
- [x] 5.2 實作大型色塊預覽 bar（即時反映選色）
- [x] 5.3 實作 Title input（create 模式空白，edit 模式預填 tag.name）
- [x] 5.4 實作 13 色網格（5 欄 grid，取自 `TAG_COLORS`），選中態加 ✓ 標記（create 模式預選空字串；edit 模式預選 tag.color）
- [x] 5.5 實作 "Remove color" 按鈕（將 color 設為空字串）
- [x] 5.6 create 模式底部：`Create` 按鈕，點擊呼叫 `createTag`，成功後切回 list
- [x] 5.7 edit 模式底部：`Save` 按鈕（呼叫 `updateTag`，成功切回 list）+ `Delete` 按鈕（切到 delete-confirm view）

## 6. TagsPopover — delete-confirm view

- [x] 6.1 實作標題列："Delete tag?" + X（X = 回到 edit view）
- [x] 6.2 實作警告文字：「沒有復原機制，這個 tag 將會從所有的卡片中被移除。」
- [x] 6.3 實作 Cancel 按鈕（切回 edit view）與 Delete 按鈕（呼叫 `deleteTag.mutateAsync`，成功切回 list）

## 7. CardDetailDialog 整合

- [x] 7.1 在 `CardDetailDialog.tsx` 中，將 `<StoryPointSelector />` 與 `<TagSection />` 替換為新的並排版面
- [x] 7.2 SP 區塊：`<label> Story Points </label>` + `<StoryPointPopover />`
- [x] 7.3 Tags 區塊：`<label> Tags </label>` + 已選 tag 的 Badge 列（各含 `×` 移除鈕）+ `<TagsPopover />`
- [x] 7.4 Badge × 按鈕直接呼叫 `detachTag`（不需開 popover）

## 8. 清理舊檔案

- [x] 8.1 刪除 `frontend/src/pages/board-detail/components/cards/StoryPointSelector.tsx`
- [x] 8.2 刪除 `frontend/src/pages/board-detail/components/tags/TagSection.tsx`
- [x] 8.3 刪除 `frontend/src/pages/board-detail/components/tags/ColorPicker.tsx`

## 9. 驗證

- [x] 9.1 啟動後端與前端，開啟卡片 dialog 確認 SP 與 Tags 並排顯示
- [x] 9.2 驗證 SP popover：選值、切換值、REMOVE 行為，popover 自動關閉
- [x] 9.3 驗證 Tags popover list view：搜尋過濾、Checkbox attach/detach
- [x] 9.4 驗證 Tags popover create view：選色、預覽、建立 tag
- [x] 9.5 驗證 Tags popover edit view：預填、改名改色、Save
- [x] 9.6 驗證 Tags popover delete-confirm view：警告文字、Cancel 返回 edit、Delete 真正刪除
- [x] 9.7 執行 `cd frontend && pnpm test` 確認既有測試未壞
