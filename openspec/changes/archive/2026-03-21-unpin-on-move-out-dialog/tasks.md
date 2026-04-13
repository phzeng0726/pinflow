## 1. 擴充 useBoardDnd hook

- [x] 1.1 在 `UseBoardDndParams` interface 新增 `onMoveOutAutoPin?: (card: Card) => void` 可選 callback 參數
- [x] 1.2 在 `handleDragEnd` 的卡片 move 邏輯中，於 `moveCardMutate` 呼叫後取得來源 column（從 `columns` 找 `dragged.columnId`）
- [x] 1.3 判斷條件：來源 column `autoPin === true` 且目標 column 不同且 `dragged.isPinned === true`，若符合則呼叫 `onMoveOutAutoPin(dragged)`

## 2. BoardPage 新增 dialog 狀態與邏輯

- [x] 2.1 在 `BoardPage` 新增 `pendingUnpinCard` state（型別 `Card | null`，初始值 `null`）
- [x] 2.2 實作 `handleMoveOutAutoPin` callback：設定 `pendingUnpinCard` 為傳入的 card
- [x] 2.3 將 `onMoveOutAutoPin: handleMoveOutAutoPin` 傳入 `useBoardDnd` 呼叫
- [x] 2.4 實作 `handleConfirmUnpin`：呼叫 `togglePin.mutate(pendingUnpinCard.id, { onSettled: () => setPendingUnpinCard(null) })`（per-call callback 僅用來關閉 dialog；toast 與 cache invalidation 已在 hook 的 `onSuccess`/`onError` 處理）
- [x] 2.5 實作 `handleDismissUnpin`：直接設定 `pendingUnpinCard` 為 `null`

## 3. 實作確認 Dialog UI

- [x] 3.1 在 `BoardPage` JSX 末尾加入 `AlertDialog`（從 `components/ui/alert-dialog` 引入，使用 `open={!!pendingUnpinCard}`，`onOpenChange` 綁定 `handleDismissUnpin`）
- [x] 3.2 Dialog 標題：「移出自動釘選欄位」；描述：「此卡片仍處於釘選狀態，是否同時取消釘選？」
- [x] 3.3 Cancel 按鈕（`AlertDialogCancel`）文字「保持釘選」
- [x] 3.4 Confirm 按鈕（`AlertDialogAction`）文字「取消釘選」，`onClick` 綁定 `handleConfirmUnpin`
- [x] 3.5 Confirm 按鈕加入 loading 狀態（`togglePin.isPending` 時 `disabled`）
