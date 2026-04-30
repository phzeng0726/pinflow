## Context

Pin Window (`PinWindow.tsx`) 顯示來自不同 board 的釘選卡片，每張卡片透過 `GET /api/v1/cards/pinned` 取得資料。目前 `PinnedCardResponse` 已包含 `boardId`、`columnId`、`columnName`，但缺少 `boardName`。PinnedCardItem 只顯示 column name badge，無法提供 board 識別，也無法從 Pin Window 直接移動卡片。

## Goals / Non-Goals

**Goals:**
- 在 PinnedCardItem 中顯示 board name，格式為 `{boardName} / {columnName}`
- Column name 改為可點擊，彈出 popover 列出同 board 所有 column
- 選擇目標 column 後將卡片移至該 column 頂部（position 0）
- 使用現有 `moveCard` mutation 與 `useBoardDetail` hook

**Non-Goals:**
- 跨 board 移動卡片
- 自訂移入位置（固定為頂部）
- 修改 Pin Window 的排序或分組行為

## Decisions

### 1. boardName 在後端填充，而非前端二次請求

**決定**：在 `GetPinnedCards()` service 中呼叫 `s.boardRepo.FindByID(boardID)` 取得 board name，加入 `PinnedCardResponse` DTO。

**理由**：Pin Window 可能有多張不同 board 的卡片，若在前端各別 fetch board 資料會發多次額外請求。後端一次填充成本最低，且 `boardRepo` 在 card service 中已注入。

**替代方案**：前端 `useBoardDetail(card.boardId)` 取得 board name → 拒絕，因為每張卡片都需一次 board fetch，且 Pin Window 開啟時 board detail 不一定已快取。

### 2. 使用 useBoardDetail 取得 column 列表，而非新增 API

**決定**：Column move popover 透過 `useBoardDetail(card.boardId)` 取得 column 清單，TanStack Query 會快取並去重複請求。

**理由**：不需要新 API endpoint；board detail 已包含所有 column；快取機制確保同 boardId 的多張卡片共用一份資料。若用戶曾開啟過該 board 的 detail page，資料已存在快取中。

**替代方案**：新增 `GET /api/v1/boards/:id/columns` 端點 → 不必要，board detail 已含此資訊。

### 3. useCardMutations(card.boardId) 在 PinnedCardItem 內部呼叫

**決定**：PinnedCardItem 自行呼叫 `useCardMutations(card.boardId)`，不透過 props callback 傳入。

**理由**：每張卡片可能屬於不同 board，需要各自的 boardId 來正確 invalidate board detail cache。PinChecklistPanel 也是同樣的模式（內部自行使用 hooks）。

### 4. 移動位置固定為 position 0（column 頂部）

**決定**：選擇目標 column 後一律插入頂部。

**理由**：在 Pin Window 快速移動的使用情境中，用戶期望卡片出現在顯眼位置；實作簡單，符合最小摩擦原則。

## Risks / Trade-offs

- **Board detail 未快取** → 若用戶從未開啟過該 board，popover 開啟時才會發出 fetch 請求，可能有短暫 loading。由於 column 列表在 popover 顯示前需要資料，可在 popover 內顯示 loading skeleton 或空白等待。風險低：網路速度通常夠快，且 popover 開啟後資料才需要顯示。
- **boardName 為新欄位** → 前端型別需同步更新，否則 TypeScript 編譯會失敗。非 breaking change（後端新增欄位，舊客戶端會忽略）。
