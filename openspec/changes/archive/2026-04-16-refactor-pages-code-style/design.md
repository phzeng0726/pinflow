## Context

`frontend/src/pages/` 累積了數個一致性問題：inline event handlers、直接解構的 props、多行 if/return 缺大括弧、樣式常數散落各檔、單檔多 component、以及 `mutateAsync` 搭配 try/catch。這些問題不影響功能，但增加維護成本與 code review 負擔。

## Goals / Non-Goals

**Goals:**
- 統一 `pages/` 下的程式碼風格
- 解決 `mutateAsync` 不加 try/catch 造成的 unhandled rejection 問題
- 將多 component 單檔拆分，或整理為主 component 置頂的結構

**Non-Goals:**
- 不改變任何功能邏輯或 API 行為
- 不修改 `pages/` 以外的程式碼（hooks、lib/api 等）
- 不引入新依賴

## Decisions

### 1. 常數集中至 `styleConfig.ts`
`COLUMN_COLORS`（`ColumnHeader.tsx`）和 `STORY_POINTS`（`StoryPointPopover.tsx`）搬入已存在的 `board-detail/components/styleConfig.ts`。該檔已有 `TAG_COLORS`、`PRIORITIES`、`DEPENDENCY_RELATIONS`，是既定的常數匯集點。

### 2. 獨立 component 拆為新檔案
`SortableChecklistItem`（~90 行，有自己的 `useSortable` hook）和 `CommentItem`（~120 行，有自己的 state）各有完整的 props interface 和內部狀態，符合獨立成檔的條件。

### 3. 同檔 render 函式改為具名 sub-component（`TagsPopover.tsx`）
`TagsPopover` 的三個 render 函式（`renderList`、`renderCreateEdit`、`renderDeleteConfirm`）依賴大量 parent state，拆成獨立檔案需要傳遞過多 props，不值得。改為同檔具名 sub-component（`TagListView`、`TagCreateEditView`、`TagDeleteConfirmView`），主 component 置頂，sub-components 往下。

### 4. `mutateAsync` 統一改為 `mutate + onSuccess`
**替代方案：** 保留 `mutateAsync` + 補上 try/catch。
**選擇原因：** mutation hook 的 `onError` 已統一處理 toast，pages 不應重複處理錯誤。`mutate` 的成功後邏輯放在 `onSuccess` callback，語意更清晰，且完全消除 unhandled rejection 問題。

### 5. Props 解構模式
只有 `DependencyPopover` 和 `CommentItem` 兩個 component 使用直接解構（其餘已是 `props: Type` 模式），改為 `props: Type` + 函式內 `const { ... } = props`，與既有風格一致。

## Risks / Trade-offs

- **風險：** 大範圍修改（~20 個檔案）若有遺漏可能造成型別錯誤 → **緩解：** 每個 Phase 後跑 `tsc --noEmit`，最終跑 `pnpm build` 確認
- **風險：** `mutate + onSuccess` 中 `onSuccess` 的 callback scope 與 `mutateAsync` 後的 sequential code 行為相同，但需注意 `onSuccess` 是 async-safe 的 → 此處所有 onSuccess 操作都是同步 state 更新，無風險

## Migration Plan

純前端重構，無 API 變更，無需 migration。驗證：
```bash
cd frontend && npx tsc --noEmit
cd frontend && pnpm build
```
