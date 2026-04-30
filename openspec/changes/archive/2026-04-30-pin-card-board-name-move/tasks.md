## 1. Backend — 新增 boardName 欄位

- [x] 1.1 在 `backend/dto/card_dto.go` 的 `PinnedCardResponse` struct 中新增 `BoardName string \`json:"boardName"\``欄位（位於`BoardID` 之後）
- [x] 1.2 在 `backend/service/card_service.go` 的 `GetPinnedCards()` 方法中，取得 `boardID` 後呼叫 `s.boardRepo.FindByID(boardID)` 取得 board name，填入 response
- [x] 1.3 執行 `cd backend && go build ./...` 確認後端編譯無誤

## 2. Frontend Types

- [x] 2.1 在 `frontend/src/types/index.ts` 的 `PinnedCard` 介面中新增 `boardName: string`（位於 `boardId` 之後）

## 3. i18n

- [x] 3.1 在 `frontend/src/locales/zh-TW.json` 的 `pin` 區塊新增 `"moveToColumn": "移至欄位"`
- [x] 3.2 在 `frontend/src/locales/en-US.json` 的 `pin` 區塊新增 `"moveToColumn": "Move to column"`

## 4. Frontend UI — PinnedCardItem

- [x] 4.1 在 `frontend/src/pages/pin/components/PinnedCardItem.tsx` 中新增 import：`useBoardDetail`（來自 `@/hooks/board/queries/useBoardDetail`）、`useCardMutations`（來自 `@/hooks/card/mutations/useCardMutations`）、`Check` icon（來自 lucide-react）
- [x] 4.2 在元件頂層新增 state `columnPopoverOpen` 與呼叫 `useBoardDetail(card.boardId)` 及 `useCardMutations(card.boardId)`
- [x] 4.3 將現有 column name `<span>`（line 169-171）替換為 board name label + column name Popover 組合：board name 純文字顯示，`/` 分隔符，column name 作為 PopoverTrigger 按鈕
- [x] 4.4 實作 PopoverContent：列出 `boardDetail?.columns` 所有 column，目前 column（`col.id === card.columnId`）顯示綠色 Check icon，點擊其他 column 呼叫 `moveCard.mutate({ id: card.id, columnId: col.id, position: 0 })` 並關閉 popover，點擊相同 column 僅關閉 popover

## 5. 驗證

- [x] 5.1 執行 `cd frontend && pnpm build` 確認 TypeScript 無型別錯誤
- [x] 5.2 手動測試：釘選來自不同 board 的卡片，確認每張卡片顯示 `{boardName} / {columnName}`
- [x] 5.3 手動測試：點擊 column name badge，確認 popover 列出同 board 所有 column，目前 column 有勾勾
- [x] 5.4 手動測試：選擇另一個 column，確認卡片成功移動，Pin Window 資料更新
