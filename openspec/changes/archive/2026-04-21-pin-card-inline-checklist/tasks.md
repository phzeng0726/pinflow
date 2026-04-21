## 1. Backend — 擴充 PinnedCardResponse

- [x] 1.1 在 `backend/dto/card_dto.go` 的 `PinnedCardResponse` 加入 `BoardID uint \`json:"boardId"\``
- [x] 1.2 在 `backend/service/card_service.go` 的 `GetPinnedCards()` 中宣告 `var boardID uint`，並在取得 column 後賦值 `boardID = col.BoardID`，最後加入回傳結構
- [x] 1.3 在 `backend/tests/service_test.go` 的 `TestCardService_GetPinnedCards` 補充 `boardId` 斷言
- [x] 1.4 執行 `cd backend && go test ./... -v` 確認通過
- [x] 1.5 執行 `cd backend && swag init` 更新 Swagger 文件

## 2. Frontend 型別

- [x] 2.1 在 `frontend/src/types/index.ts` 的 `PinnedCard` interface 加入 `boardId: number`

## 3. 新增 usePinChecklistToggle Hook

- [x] 3.1 建立 `frontend/src/hooks/checklist/mutations/usePinChecklistToggle.ts`
  - `mutationFn`：呼叫 `api.updateChecklistItem(id, { completed })`
  - `onSuccess`：invalidate `queryKeys.cards.detail(cardId)`、`queryKeys.boards.detail(boardId)`、`queryKeys.cards.pinned()`
  - `onError`：`toast.error(t('toast.checklist.itemUpdateError'))`

## 4. 新增 PinChecklistPanel 元件

- [x] 4.1 建立 `frontend/src/pages/pin/components/PinChecklistPanel.tsx`
  - Props：`{ cardId: number; boardId: number }`
  - 使用 `useCardDetail(cardId)` 取得完整 checklists
  - 使用 `usePinChecklistToggle(boardId, cardId)` 處理 toggle
- [x] 4.2 實作預設 checklist 選擇邏輯（`useMemo`：position 排序後取第一個有未完成 item 的；全完成則取第一個）
- [x] 4.3 實作 `useEffect`：當 card data 載入後設定初始 `selectedChecklistId`；若選取的 checklist 已不存在則 reset
- [x] 4.4 實作 Select 下拉選單（shadcn `Select`），每個選項顯示 checklist 標題 + `completedCount/totalCount`
- [x] 4.5 實作 item 列表：`Checkbox` + `Label`，completed 顯示 `line-through text-gray-400`，checkbox onChange 呼叫 toggle mutation
- [x] 4.6 Loading 狀態顯示 spinner（`Loader2` icon + `animate-spin`）
- [x] 4.7 無 item 時顯示 `t('pin.noChecklistItems')` 提示文字

## 5. 修改 PinnedCardItem

- [x] 5.1 在 `frontend/src/pages/pin/components/PinnedCardItem.tsx` 加入 `expanded` state (`useState(false)`)
- [x] 5.2 將現有 checklist 摘要區塊（CheckSquare icon + count）改為可點擊的 `button`，點擊 toggle `expanded`
- [x] 5.3 加入 `ChevronDown`/`ChevronUp` icon（依 `expanded` 狀態切換）
- [x] 5.4 在 `columnName` badge 下方，當 `expanded && totalCount > 0` 時渲染 `<PinChecklistPanel cardId={card.id} boardId={card.boardId} />`

## 6. i18n

- [x] 6.1 在 `frontend/src/locales/zh-TW.json` 的 `pin` namespace 加入 `"noChecklistItems": "此清單尚無項目"`
- [x] 6.2 在 `frontend/src/locales/en-US.json` 的 `pin` namespace 加入 `"noChecklistItems": "No items in this checklist"`

## 7. 驗證

- [x] 7.1 執行 `cd frontend && pnpm build` 確認無 TypeScript 錯誤
- [x] 7.2 啟動 dev server，建立含多個 checklist 的卡片並釘選，驗證展開/收合、預設選取、checkbox toggle、摘要更新
