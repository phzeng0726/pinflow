## 1. Snapshot restore — invalidate pinned

- [x] 1.1 在 `useSnapshotMutations.ts` 新增 `invalidatePinned` helper
- [x] 1.2 在 `restore.onSuccess` 加入 `await invalidatePinned()`

## 2. Board delete — invalidate pinned

- [x] 2.1 在 `useBoardMutations.ts` 新增 `invalidatePinned` helper
- [x] 2.2 在 `remove.onSuccess` 加入 `await invalidatePinned()`

## 3. Column delete — invalidate pinned

- [x] 3.1 在 `useColumnMutations.ts` 新增 `invalidatePinned` helper
- [x] 3.2 在 `remove.onSuccess` 的 `Promise.all` 加入 `invalidatePinned()`

## 4. 防禦性修復

- [x] 4.1 `PinnedCardItem.tsx:208` — `boardDetail?.columns.map(...)` 改為 `(boardDetail?.columns ?? []).map(...)`
- [x] 4.2 `useCardMutations.ts:114` — `old.columns.map(...)` 改為 `(old.columns ?? []).map(...)`
