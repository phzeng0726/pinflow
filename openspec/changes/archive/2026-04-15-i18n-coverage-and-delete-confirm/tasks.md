## 1. Locale JSON 更新

- [x] 1.1 修復 `zh-TW.json` 遺漏翻譯：`priority.title`、`priority.remove`、`storyPoint.title`、`storyPoint.remove`、`schedule.title`、`tags.title`
- [x] 1.2 修正 `en-US.json` 按鈕 Sentence case：`common.remove`、`priority.remove`、`storyPoint.remove` 由 `"REMOVE"` 改為 `"Remove"`
- [x] 1.3 在 `en-US.json` 新增 `confirm` namespace（`deleteBoardTitle`、`deleteBoardDesc`、`deleteColumnTitle`、`deleteColumnDesc`、`deleteChecklistTitle`）
- [x] 1.4 在 `zh-TW.json` 新增 `confirm` namespace（同上，填入中文值）
- [x] 1.5 在 `en-US.json` 新增 `validation` namespace（8 個 key：`boardName`、`columnName`、`cardTitle`、`endBeforeStart`、`tagName`、`checklistTitle`、`checklistItemText`、`targetColumn`）
- [x] 1.6 在 `zh-TW.json` 新增 `validation` namespace（同上，填入中文值）
- [x] 1.7 在 `en-US.json` 新增 `toast` namespace，按 domain 分組（`board`、`card`、`column`、`checklist`、`comment`、`dependency`、`tag`），掃描各 mutation hook 取得完整 key 清單
- [x] 1.8 在 `zh-TW.json` 新增 `toast` namespace（同上，填入中文值）
- [x] 1.9 從 `en-US.json` 與 `zh-TW.json` 移除 `priority.remove` 和 `storyPoint.remove` key

## 2. 按鈕 Casing 修正

- [x] 2.1 `PriorityPopover.tsx`：將 `t('priority.remove')` 改為 `t('common.remove')`
- [x] 2.2 `StoryPointPopover.tsx`：將 `t('storyPoint.remove')` 改為 `t('common.remove')`

## 3. Zod Schema Factory 化

- [x] 3.1 重構 `lib/schemas.ts`：將所有 schema 改為 `createXxxSchema(t: TFunction)` factory 函式，驗證訊息改用 `t('validation.xxx')`
- [x] 3.2 更新 `BoardListPage.tsx`：使用 `useMemo(() => createBoardSchema(t), [t])`
- [x] 3.3 更新 Column 相關元件：使用 `useMemo(() => createColumnSchema(t), [t])`（grep `from '@/lib/schemas'` 確認完整清單）
- [x] 3.4 更新 Card 相關元件（`cardSchema`、`scheduleSchema`）：使用對應的 factory 函式
- [x] 3.5 更新 `TagsPopover.tsx`：使用 `useMemo(() => createTagSchema(t), [t])`
- [x] 3.6 更新 `ChecklistBlock.tsx`：使用 `useMemo(() => createChecklistSchema(t), [t])` 和 `createChecklistItemSchema(t)`
- [x] 3.7 更新 `DuplicateCardDialog.tsx`：使用 `useMemo(() => createDuplicateCardSchema(t), [t])`

## 4. Mutation Toast i18n

- [x] 4.1 `hooks/board/mutations/useBoardMutations.ts`：加入 `useTranslation()`，替換所有 `toast.success/error` 中的硬編碼字串為 `t('toast.board.xxx')`
- [x] 4.2 `hooks/card/mutations/useCardMutations.ts`：同上，使用 `t('toast.card.xxx')`
- [x] 4.3 `hooks/column/mutations/useColumnMutations.ts`：同上，使用 `t('toast.column.xxx')`
- [x] 4.4 `hooks/checklist/mutations/useChecklistMutations.ts`：同上，使用 `t('toast.checklist.xxx')`
- [x] 4.5 `hooks/comment/mutations/useCommentMutations.ts`：同上，使用 `t('toast.comment.xxx')`
- [x] 4.6 `hooks/dependency/mutations/useDependencyMutations.ts`：同上，使用 `t('toast.dependency.xxx')`
- [x] 4.7 `hooks/tag/mutations/useTagMutations.ts`：同上，使用 `t('toast.tag.xxx')`

## 5. 新增刪除確認框

- [x] 5.1 `BoardListPage.tsx`：新增 `showDeleteConfirm: { id: number; name: string } | null` state；刪除圖示改為 `setShowDeleteConfirm`；新增 AlertDialog 元件（使用 `confirm.deleteBoardTitle`/`confirm.deleteBoardDesc`，確認按鈕 `variant="destructive"`）
- [x] 5.2 `ColumnHeader.tsx`：新增 `deleteOpen: boolean` state；DropdownMenuItem `onSelect` 改為 `e.preventDefault(); setDeleteOpen(true)`；新增 AlertDialog（使用 `confirm.deleteColumnTitle`/`confirm.deleteColumnDesc`）放在 DropdownMenu 外層
- [x] 5.3 `ChecklistBlock.tsx`：新增 `deleteOpen: boolean` state；刪除圖示改為 PopoverTrigger；Popover 包含確認文字（`confirm.deleteChecklistTitle`）及取消/刪除按鈕，刪除按鈕 `variant="destructive"`

## 6. 驗證

- [x] 6.1 執行 `cd frontend && pnpm build` 確認無型別錯誤
- [x] 6.2 執行 `cd frontend && pnpm test` 確認無測試回歸
