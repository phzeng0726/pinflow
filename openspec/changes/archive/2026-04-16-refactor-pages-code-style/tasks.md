## 1. 前置作業

- [x] 1.1 Commit 目前 `CommentSection.tsx` 和 `BoardListPage.tsx` 的未提交修改

## 2. 結構性變更（拆檔案 + 搬常數）

- [x] 2.1 將 `COLUMN_COLORS` 從 `columns/ColumnHeader.tsx:36-43` 搬入 `styleConfig.ts`，更新 import
- [x] 2.2 將 `STORY_POINTS` 從 `cards/StoryPointPopover.tsx:14` 搬入 `styleConfig.ts`，更新 import
- [x] 2.3 建立 `checklists/SortableChecklistItem.tsx`，從 `ChecklistBlock.tsx:286-384` 搬出 interface + component，更新 `ChecklistBlock.tsx` 的 import
- [x] 2.4 建立 `comments/CommentItem.tsx`，從 `CommentSection.tsx:19-141` 搬出 interface + component（改為 export），更新 `CommentSection.tsx` 的 import 並清理不再使用的 imports
- [x] 2.5 將 `TagsPopover.tsx` 的 `renderList`、`renderCreateEdit`、`renderDeleteConfirm` 改寫為具名 sub-components（`TagListView`、`TagCreateEditView`、`TagDeleteConfirmView`），主 component 置頂，sub-components 往下

## 3. Props 解構模式修正

- [x] 3.1 `cards/DependencyPopover.tsx:25`：改為 `(props: DependencyPopoverProps)` + 函式內解構
- [x] 3.2 `comments/CommentItem.tsx`（新檔案）：改為 `(props: CommentItemProps)` + 函式內解構

## 4. 多行 if/return 加大括弧

- [x] 4.1 `BoardPage.tsx:99-110`：兩個 early return guard 加大括弧
- [x] 4.2 `cards/CardDetailDialog.tsx:85-86`：兩個 early return guard 加大括弧

## 5. mutateAsync → mutate + onSuccess

- [x] 5.1 `comments/CommentSection.tsx:161-171`：移除 try/catch，改 `create.mutate` + onSuccess
- [x] 5.2 `board-list/BoardListPage.tsx:53-57`：改 `createBoard.mutate` + onSuccess（`reset`, `setCreating(false)`）
- [x] 5.3 `columns/AddColumnForm.tsx:30-34`：改 `createColumn.mutate` + onSuccess（`resetCol`, `setAddingColumn(false)`）
- [x] 5.4 `checklists/ChecklistBlock.tsx:102-106`：改 `createItem.mutate` + onSuccess（`newItemForm.reset`, `setShowItemForm(false)`）
- [x] 5.5 `checklists/ChecklistSection.tsx:42-46`：改 `createChecklist.mutate` + onSuccess（`reset`, `setShowNewForm(false)`）
- [x] 5.6 `cards/CardDetailDialog.tsx:64-76`：改 `updateCard.mutate`（無 onSuccess 操作）
- [x] 5.7 `cards/CardItem.tsx:109-118`：改 `updateCard.mutate` + onSuccess（`setShowMenu(false)`）
- [x] 5.8 `cards/TagsPopover.tsx:178-188`：`handleSave` 改 `createTag.mutate` / `updateTag.mutate` + onSuccess（`setView('list')`）
- [x] 5.9 `cards/TagsPopover.tsx:344-347`：inline async onClick 改 `deleteTag.mutate` + onSuccess（`setView('list')`）

## 6. Inline event handlers 提取為具名函式

- [x] 6.1 `BoardPage.tsx`（~5 個 inline handlers）
- [x] 6.2 `board-list/BoardListPage.tsx`（~6 個 inline handlers）
- [x] 6.3 `cards/AddCardForm.tsx`（~2 個）
- [x] 6.4 `cards/CardContextMenu.tsx`（~6 個）
- [x] 6.5 `cards/CardDetailDialog.tsx`（~4 個）
- [x] 6.6 `cards/CardItem.tsx`（~4 個）
- [x] 6.7 `cards/DependencyPopover.tsx`（~3 個）
- [x] 6.8 `cards/DuplicateCardDialog.tsx`（~1 個）
- [x] 6.9 `cards/PriorityPopover.tsx`（~2 個）
- [x] 6.10 `cards/SchedulePopover.tsx`（~3 個）
- [x] 6.11 `cards/StoryPointPopover.tsx`（~2 個）
- [x] 6.12 `cards/TagsPopover.tsx`（~8 個，配合 2.5 的 sub-component 拆分）
- [x] 6.13 `checklists/ChecklistBlock.tsx`（~8 個）
- [x] 6.14 `checklists/ChecklistSection.tsx`（~2 個）
- [x] 6.15 `checklists/SortableChecklistItem.tsx`（新檔案，~2 個）
- [x] 6.16 `columns/AddColumnForm.tsx`（~1 個）
- [x] 6.17 `columns/ColumnHeader.tsx`（~4 個）
- [x] 6.18 `comments/CommentItem.tsx`（新檔案，~4 個）
- [x] 6.19 `comments/CommentSection.tsx`（~2 個）

## 7. 驗證

- [x] 7.1 執行 `cd frontend && npx tsc --noEmit`，確認無型別錯誤
- [x] 7.2 執行 `cd frontend && pnpm build`，確認 build 成功
- [x] 7.3 Commit 所有重構變更（一次 commit）
