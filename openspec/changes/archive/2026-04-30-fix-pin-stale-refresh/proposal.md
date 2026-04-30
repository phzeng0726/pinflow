## Why

Pin 視窗在以下操作後不會自動刷新：還原 snapshot、刪除 board、刪除 column；同時當含有 pinned card 的最後一個 column 被刪除時，`PinnedCardItem` 會因 `boardDetail.columns` 為 `undefined` 而 crash。這些 bug 都存在於目前的 `perf/pin` branch，需要在合併前修復。

## What Changes

- `useSnapshotMutations` — restore 成功後加入 `invalidatePinned()`
- `useBoardMutations` — board 刪除成功後加入 `invalidatePinned()`
- `useColumnMutations` — column 刪除成功後加入 `invalidatePinned()`
- `PinnedCardItem` — `boardDetail?.columns.map(...)` 改為 `(boardDetail?.columns ?? []).map(...)`，防禦 `columns` 可能為 `undefined`
- `useCardMutations` (deleteCard onMutate) — `old.columns.map(...)` 改為 `(old.columns ?? []).map(...)`，同樣的防禦

## Capabilities

### New Capabilities
- `pin-board-refresh`: Pin 視窗的資料刷新規格——定義哪些操作（snapshot restore、board 刪除、column 刪除）必須 invalidate pinned cards 查詢，以及前端對 `boardDetail.columns` 可能為 undefined 的防禦規範

### Modified Capabilities

（無需求層面的規格變更，僅為 bug fix 實作）

## Impact

- `frontend/src/hooks/snapshot/mutations/useSnapshotMutations.ts`
- `frontend/src/hooks/board/mutations/useBoardMutations.ts`
- `frontend/src/hooks/column/mutations/useColumnMutations.ts`
- `frontend/src/pages/pin/components/PinnedCardItem.tsx`
- `frontend/src/hooks/card/mutations/useCardMutations.ts`
