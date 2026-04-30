## Context

Pin 視窗（`PinWindow` / `PinnedCardItem`）透過 `usePinnedCards()` 查詢所有 pinned cards。當 snapshot 被還原、board 被刪除、或 column 被刪除時，這些 mutations 的 `onSuccess` 只 invalidate 各自的主查詢（board detail / snapshots），**沒有** invalidate `queryKeys.cards.pinned()`，導致 pin 窗格持續顯示過時資料。

另外，`PinnedCardItem` 在 column move popover 中呼叫 `boardDetail?.columns.map(...)` — 若 board 不含任何 column（backend 的 `omitempty` 使 columns 欄位被省略），`boardDetail.columns` 在 runtime 為 `undefined`，造成 crash。

## Goals / Non-Goals

**Goals:**
- 三個 mutation（restore snapshot、delete board、delete column）在成功後均 invalidate pinned cards 查詢
- `PinnedCardItem` 及 `useCardMutations` 對 `columns` 可能為 `undefined` 做防禦性處理

**Non-Goals:**
- 不改變 backend 的 JSON 序列化行為
- 不對 pin 視窗做任何 UX 重構

## Decisions

### 在 mutation `onSuccess` 加入 `invalidatePinned()`
在三個 mutation hooks 中各自新增 `invalidatePinned` helper，與既有 `invalidateBoardDetail` 等一致的模式。比起在共用 middleware 處理更簡單、局部、符合現有程式碼慣例。

### 防禦性的 `?? []` 而非修改 backend
`boardDetail?.columns ?? []` 與 `(old.columns ?? [])` 在前端修正，不引入 backend 變更。後端的 `omitempty` 行為本身合理（省略空 array），前端應對此做防禦。

## Risks / Trade-offs

- [Race condition] restore snapshot 同時 invalidate pinned 與 board detail，兩個查詢並發，pin 窗格可能短暫閃爍 → 可接受，行為正確且與其他 mutation 一致

## Migration Plan

僅前端程式碼修改，無資料遷移需求，無需 rollback 策略。
