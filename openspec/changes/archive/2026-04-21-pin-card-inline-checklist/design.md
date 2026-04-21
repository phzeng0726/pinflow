## Context

`PinnedCardItem` 目前僅顯示 `completedCount/totalCount` 的靜態摘要。使用者需打開卡片詳情 Dialog 才能操作 checklist item。Pin 視窗的設計目的是快速查看與操作釘選任務，因此缺少就地操作 checklist 的能力會造成不必要的切換。

後端 `GET /cards/pinned` 回傳的 `PinnedCardResponse` 缺少 `boardId`，但前端 `useChecklistMutations` 需要 `boardId` 來正確 invalidate `boards.detail` query cache。

## Goals / Non-Goals

**Goals:**
- Pin 視窗中可展開指定 checklist 並切換 item 完成狀態
- toggle item 後 pinned cards 摘要數字即時更新
- 其餘卡片資訊（標題、描述、標籤等）維持唯讀

**Non-Goals:**
- 在 Pin 視窗新增/編輯/刪除 checklist 或 item
- 拖曳排序 item
- 在 Pin 視窗顯示 checklist 的 markdown 模式

## Decisions

### 1. 懶載入 card detail 而非擴充 pinned cards endpoint

**決定**：展開 checklist 面板時才呼叫 `useCardDetail(cardId)` 取得完整 checklists 資料。

**替代方案**：擴充 `GET /cards/pinned` 回傳完整 checklists 陣列。  
**理由**：Pin 視窗的卡片通常 < 10 張，且多數使用者不一定每次都展開 checklist。懶載入避免在每次進入 Pin 視窗時傳輸大量 checklist 資料。React Query 會快取結果，重複展開/收合不會重新請求。

### 2. 新增 `usePinChecklistToggle` 而非修改 `useChecklistMutations`

**決定**：建立專用的 `usePinChecklistToggle(boardId, cardId)` hook。

**替代方案**：修改 `useChecklistMutations` 加入 optional callback 或同時 invalidate pinned cards query。  
**理由**：`useChecklistMutations` 在 board detail dialog 使用，額外 invalidate `cards.pinned()` 會造成不必要的 refetch。職責分離更清晰，且 Pin 頁面不需要 create/delete list 等其他 mutations。

### 3. checklist 面板預設收合

**決定**：`PinnedCardItem` 預設收合，點擊摘要區塊才展開。

**理由**：Pin 視窗設計為緊湊的浮動面板。若每張卡片都預設展開所有 items，視窗高度會急速增加，破壞可讀性。收合設計同時讓懶載入發揮效果。

### 4. 後端 `PinnedCardResponse` 加 `boardId`

**決定**：在 DTO 加入 `boardId`，服務層從已取得的 `col.BoardID` 傳出。

**理由**：`boardId` 是 query invalidation 的必要參數。後端已在 `GetPinnedCards()` 中取得 column，成本極低。

## Risks / Trade-offs

- **N+1 queries**：每張展開的 Pin 卡片觸發一次 `GET /cards/:id`。→ 接受，Pin 卡片數量少，React Query 快取後無重複請求。
- **資料不一致**：若 checklist 在 board 頁面被刪除，Pin 視窗尚未 refetch 時 `selectedChecklistId` 可能無效。→ `PinChecklistPanel` 偵測選取的 checklist 不存在時自動 reset 至預設值。
- **Select portal in Electron**：shadcn Select 使用 `portal` 渲染到 `document.body`，在 Electron 的獨立 BrowserWindow 中運作正常，無需特別處理。
