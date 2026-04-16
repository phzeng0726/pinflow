## Why

`frontend/src/pages/` 下的程式碼存在多項一致性問題：inline event handlers、直接解構的 props 參數、多行 if/return 缺少大括弧、常數散落各檔、單一檔案含多個 component、`mutateAsync` 搭配 try/catch 而非 `mutate` + onSuccess。此次重構統一程式碼風格，不改變任何功能邏輯。

## What Changes

- 將 `COLUMN_COLORS`、`STORY_POINTS` 常數搬入已存在的 `styleConfig.ts`
- 拆出 `SortableChecklistItem`（從 `ChecklistBlock.tsx`）為獨立檔案
- 拆出 `CommentItem`（從 `CommentSection.tsx`）為獨立檔案
- 將 `TagsPopover.tsx` 中的 3 個 render 函式拆為具名 sub-components（`TagListView`、`TagCreateEditView`、`TagDeleteConfirmView`），保留在同一檔案內，主 component 置頂、sub-components 往下
- 修正 `DependencyPopover` 與 `CommentItem` 的 props 解構模式：改為 `props: Type` + 函式內解構
- 多行 `if/return` 加上大括弧（`BoardPage.tsx`、`CardDetailDialog.tsx`）
- `pages/` 下所有 `mutateAsync` 統一改為 `mutate` + `onSuccess` callback，移除 try/catch（共 9 個檔案）
- 所有 JSX inline event handlers 提取為具名 `const handleXxx` 函式（共 18 個檔案）

## Capabilities

### New Capabilities
<!-- 無：此次為純重構，不引入新功能 -->

### Modified Capabilities
<!-- 無：此次不改變任何 spec 層級的行為或需求 -->

## Impact

- **修改範圍：** `frontend/src/pages/` 下所有 component 檔案（約 20 個）
- **無 API 變更**、無新依賴、無 breaking changes
- **驗證方式：** `npx tsc --noEmit` + `pnpm build` 確認無型別錯誤與 build 失敗
