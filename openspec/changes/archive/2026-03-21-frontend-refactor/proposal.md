## Why

隨著前端功能逐漸完備，部分程式碼出現了與 `.claude/skills/code-review-fe/SKILL.md` 所定義的規範不一致的地方，包括 Zustand selector 誤用、Mutation 命名慣例不符、以及 `Promise.all` 缺少 `await`，需要統一修正以降低潛在的 bug 風險並維持程式碼品質。

## What Changes

- **修正 `useBoardMutations`**：`update.onSuccess` 補上 `async/await`；所有 mutations 補上繁體中文 toast
- **修正 `BoardPage`**：將解構式 `useThemeStore()` 改為 selector 寫法，避免不必要重渲染
- **修正 `useCardMutations`**：內部 mutation 變數改用簡化動詞命名（`create`、`move`、`toggle`、`update`、`remove`、`duplicate`），return 時加上 domain 前綴
- **修正 `useChecklistMutations`**：同上，內部命名改用簡化動詞
- **修正 `useColumnMutations`**：`update.onSettled` 補上 `await`

## Capabilities

### New Capabilities
- `frontend-conventions`: 前端程式碼規範的實作標準，涵蓋 Mutation 命名慣例、Zustand selector、非同步 Promise 處理與 toast 通知

### Modified Capabilities
（無需求層級變更，僅實作層修正）

## Impact

- `frontend/src/hooks/board/mutations/useBoardMutations.ts`
- `frontend/src/hooks/card/mutations/useCardMutations.ts`
- `frontend/src/hooks/checklist/mutations/useChecklistMutations.ts`
- `frontend/src/hooks/column/mutations/useColumnMutations.ts`
- `frontend/src/features/board/BoardPage.tsx`
