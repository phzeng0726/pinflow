## Why

`refactor/app` 分支上的 UI 字串覆蓋率約 90%，剩餘的 Zod 驗證訊息、mutation toast 訊息仍硬編碼中文，`zh-TW.json` 也有 6 個 key 未翻譯；同時英文按鈕大小寫不一致（`REMOVE` vs Sentence case），以及刪除 Board / Column / Checklist group 無任何確認提示，誤刪風險高。本次統一補齊這三類問題。

## What Changes

- **Locale JSON 修復**：補齊 `zh-TW.json` 遺漏的 6 個 key 翻譯（`priority.title`、`priority.remove`、`storyPoint.title`、`storyPoint.remove`、`schedule.title`、`tags.title`）
- **英文 Sentence case 統一**：`en-US.json` 的 `common.remove`、`priority.remove`、`storyPoint.remove` 由 `"REMOVE"` 改為 `"Remove"`；並將 `priority.remove`、`storyPoint.remove` 移除，對應元件改用 `common.remove`
- **新增 i18n namespace**：`confirm`（確認框文案）、`validation`（Zod 錯誤訊息）、`toast`（mutation 成功/失敗訊息）
- **Zod Schema factory 化**：`lib/schemas.ts` 改為工廠函式模式（`createXxxSchema(t)`），呼叫端以 `useMemo` 建立 schema 實例，錯誤訊息直接可顯示
- **Mutation toast i18n**：7 個 mutation hook 改用 `useTranslation()` + `t('toast.xxx')` 取代硬編碼中文訊息
- **新增刪除確認框**（3 處）：
  - `BoardListPage.tsx` — 刪除 Board → AlertDialog（Dialog 外部）
  - `ColumnHeader.tsx` — 刪除 Column → AlertDialog（Dialog 外部）
  - `ChecklistBlock.tsx` — 刪除 Checklist group → Popover 確認（Dialog 內部）
- **不變動**：unpin、從 card 移除 tag、移除 dependency、移除 tag 顏色、刪除單一 checklist item 均維持一鍵直接操作

## Capabilities

### New Capabilities

- `i18n-full-coverage`: 擴充 locale JSON（`confirm`、`validation`、`toast` namespace），修復遺漏翻譯，Zod schema factory 化，mutation toast 改用 i18n key
- `delete-confirmation`: 刪除 Board、Column、Checklist group 時顯示確認框，防止誤刪；AlertDialog 用於 Dialog 外部、Popover 用於 Dialog 內部

### Modified Capabilities

（無現有 spec 需變更）

## Impact

**修改的檔案：**

- `frontend/src/locales/en-US.json`
- `frontend/src/locales/zh-TW.json`
- `frontend/src/lib/schemas.ts`（schema factory 化）
- 呼叫 `from '@/lib/schemas'` 的所有元件（BoardListPage、ColumnHeader 等約 7 個）
- `frontend/src/hooks/board/mutations/useBoardMutations.ts`
- `frontend/src/hooks/card/mutations/useCardMutations.ts`
- `frontend/src/hooks/column/mutations/useColumnMutations.ts`
- `frontend/src/hooks/checklist/mutations/useChecklistMutations.ts`
- `frontend/src/hooks/comment/mutations/useCommentMutations.ts`
- `frontend/src/hooks/dependency/mutations/useDependencyMutations.ts`
- `frontend/src/hooks/tag/mutations/useTagMutations.ts`
- `frontend/src/pages/board-detail/components/cards/PriorityPopover.tsx`
- `frontend/src/pages/board-detail/components/cards/StoryPointPopover.tsx`
- `frontend/src/pages/board-list/BoardListPage.tsx`
- `frontend/src/pages/board-detail/components/columns/ColumnHeader.tsx`
- `frontend/src/pages/board-detail/components/checklists/ChecklistBlock.tsx`

**依賴：**

- `react-i18next`（已存在）
- `@/components/ui/alert-dialog`（已存在，`CardContextMenu.tsx` 有範本）
- `@/components/ui/popover`（已存在，`CommentSection.tsx` 有範本）

**無 API / backend 變動。**
