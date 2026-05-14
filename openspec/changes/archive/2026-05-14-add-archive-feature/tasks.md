## 1. Backend Model & Store

- [x] 1.1 在 `backend/model/card.go` Card struct 新增 `ArchivedAt *time.Time` 欄位（json:"archivedAt"）
- [x] 1.2 在 `backend/model/column.go` Column struct 新增 `ArchivedAt *time.Time` 欄位（json:"archivedAt"）
- [x] 1.3 在 `backend/store/store.go` CardFile struct 新增 `ArchivedAt *time.Time` 欄位
- [x] 1.4 更新 `copyCard` 函式以複製 ArchivedAt 欄位
- [x] 1.5 修改 `GetColumnsByBoard`：跳過 `ArchivedAt != nil` 的 column
- [x] 1.6 修改 `GetCardsByColumn`：跳過 `ArchivedAt != nil` 的 card
- [x] 1.7 修改 `GetPinnedCards`：跳過 `ArchivedAt != nil` 的 card
- [x] 1.8 修改 `SearchCards`：跳過 `ArchivedAt != nil` 的 card
- [x] 1.9 新增 `GetArchivedCardsByBoard(boardID uint) []CardFile` 方法
- [x] 1.10 新增 `GetArchivedColumnsByBoard(boardID uint) []model.Column` 方法
- [x] 1.11 新增 `GetAllCardsByColumn(columnID uint) []CardFile` 方法（含已封存，供封存/還原使用）
- [x] 1.12 新增 `GetColumnIncludingArchived(id uint) (*model.Column, error)` 方法

## 2. Backend Repository

- [x] 2.1 更新 `backend/repository/board_repository.go` 的 `cardFileToModel` 函式：新增 ArchivedAt 欄位映射
- [x] 2.2 更新 `backend/repository/board_repository.go` 的 `modelToCardFile` 函式：新增 ArchivedAt 欄位映射
- [x] 2.3 更新 `backend/repository/card_repository.go` 的 `FindPinned` inline mapping：新增 ArchivedAt
- [x] 2.4 在 `backend/repository/repository.go` CardRepository interface 新增：`ArchiveCard`、`RestoreCard`、`FindArchivedByBoardID`
- [x] 2.5 在 `backend/repository/repository.go` ColumnRepository interface 新增：`ArchiveColumn`、`RestoreColumn`、`FindArchivedByBoardID`
- [x] 2.6 在 `backend/repository/card_repository.go` 實作 `ArchiveCard(id uint) error`
- [x] 2.7 在 `backend/repository/card_repository.go` 實作 `RestoreCard(id uint, position float64) error`
- [x] 2.8 在 `backend/repository/card_repository.go` 實作 `FindArchivedByBoardID(boardID uint) ([]model.Card, error)`
- [x] 2.9 在 `backend/repository/column_repository.go` 實作 `ArchiveColumn(id uint) error`
- [x] 2.10 在 `backend/repository/column_repository.go` 實作 `RestoreColumn(id uint, position float64) error`
- [x] 2.11 在 `backend/repository/column_repository.go` 實作 `FindArchivedByBoardID(boardID uint) ([]model.Column, error)`

## 3. Backend Service & DTO

- [x] 3.1 建立 `backend/dto/archive_dto.go`：定義 `ArchivedCardResponse` 和 `ArchivedColumnResponse`
- [x] 3.2 在 `backend/service/service.go` 新增 `ArchiveService` interface 定義
- [x] 3.3 在 `backend/service/service.go` Services struct 新增 `Archive ArchiveService` 欄位
- [x] 3.4 建立 `backend/service/archive_service.go`：實作 `archiveService` struct 及 constructor
- [x] 3.5 實作 `ArchiveCard`：設定 archivedAt，若 isPinned 先 unpin
- [x] 3.6 實作 `ArchiveColumn`：設定 column archivedAt
- [x] 3.7 實作 `ArchiveAllCardsInColumn`：遍歷欄位所有未封存 cards 並設定 archivedAt
- [x] 3.8 實作 `RestoreCard`：計算 top position，清除 archivedAt（考慮 column 封存/刪除狀態）
- [x] 3.9 實作 `RestoreColumn`：計算 board 右側 position，清除 column archivedAt
- [x] 3.10 實作 `DeleteArchivedCard`：驗證已封存，呼叫現有刪除邏輯（清除 images、dependencies）
- [x] 3.11 實作 `DeleteArchivedColumn`：驗證已封存，呼叫現有 cascade 刪除邏輯
- [x] 3.12 實作 `GetArchivedCards`：查詢封存卡片並附帶 column 名稱和狀態
- [x] 3.13 實作 `GetArchivedColumns`：查詢封存欄位並附帶 card count
- [x] 3.14 在 `backend/service/service.go` NewServices 中初始化 Archive service

## 4. Backend API

- [x] 4.1 建立 `backend/api/archive_handler.go`：定義 `ArchiveHandler` struct
- [x] 4.2 實作 `ArchiveCard` handler（PATCH /cards/:id/archive）
- [x] 4.3 實作 `RestoreCard` handler（PATCH /cards/:id/restore）
- [x] 4.4 實作 `DeleteArchivedCard` handler（DELETE /cards/:id/archive）
- [x] 4.5 實作 `ArchiveColumn` handler（PATCH /columns/:id/archive）
- [x] 4.6 實作 `ArchiveAllCardsInColumn` handler（PATCH /columns/:id/archive-cards）
- [x] 4.7 實作 `RestoreColumn` handler（PATCH /columns/:id/restore）
- [x] 4.8 實作 `DeleteArchivedColumn` handler（DELETE /columns/:id/archive）
- [x] 4.9 實作 `GetArchivedCards` handler（GET /boards/:id/archive/cards）
- [x] 4.10 實作 `GetArchivedColumns` handler（GET /boards/:id/archive/columns）
- [x] 4.11 在 `backend/api/handler.go` Handlers struct 新增 `Archive *ArchiveHandler`，並在 NewHandlers 初始化
- [x] 4.12 在 `backend/api/router.go` 註冊所有新路由
- [x] 4.13 執行 `cd backend && go build ./...` 確認編譯無誤
- [x] 4.14 執行 `cd backend && swag init` 更新 Swagger 文件

## 5. Frontend 型別與 API

- [x] 5.1 在 `frontend/src/types/index.ts` 的 Card interface 新增 `archivedAt: string | null`
- [x] 5.2 在 `frontend/src/types/index.ts` 的 Column interface 新增 `archivedAt: string | null`
- [x] 5.3 在 `frontend/src/types/index.ts` 新增 `ArchivedCard` 和 `ArchivedColumn` interface
- [x] 5.4 建立 `frontend/src/lib/api/archive.ts`：實作所有封存相關 API 函式
- [x] 5.5 在 `frontend/src/lib/api/index.ts` 新增 `export * from './archive'`

## 6. Frontend Hooks

- [x] 6.1 在 `frontend/src/hooks/queryKeys.ts` 新增 `archive.cards` 和 `archive.columns` query keys
- [x] 6.2 建立 `frontend/src/hooks/archive/queries/useArchivedItems.ts`：`useArchivedCards` 和 `useArchivedColumns`
- [x] 6.3 建立 `frontend/src/hooks/archive/mutations/useArchiveMutations.ts`：所有封存操作 mutations，含 toast 和 query invalidation

## 7. Frontend shadcn/ui 元件

- [x] 7.1 執行 `cd frontend && npx shadcn@latest add sheet` 安裝 Sheet 元件
- [x] 7.2 執行 `cd frontend && npx shadcn@latest add tabs` 安裝 Tabs 元件

## 8. Frontend UI 元件

- [x] 8.1 建立 `frontend/src/pages/board-detail/components/archive/ArchivedCardItem.tsx`：顯示封存卡片項目（標題、欄位名稱、封存時間、還原按鈕、刪除按鈕）
- [x] 8.2 建立 `frontend/src/pages/board-detail/components/archive/ArchivedColumnItem.tsx`：顯示封存欄位項目（欄位名稱、card count badge、封存時間、還原按鈕、刪除按鈕）
- [x] 8.3 建立 `frontend/src/pages/board-detail/components/archive/ArchiveDrawer.tsx`：Sheet 容器，含 Cards/Columns tabs 和相應的空狀態，使用 AlertDialog 確認永久刪除

## 9. Frontend 現有元件修改

- [x] 9.1 修改 `frontend/src/pages/board-detail/components/cards/CardContextMenu.tsx`：在 Duplicate 和 Delete 之間新增「封存」選項
- [x] 9.2 修改 `frontend/src/pages/board-detail/components/columns/ColumnHeader.tsx`：在 AutoPin 和 Delete 之間新增「封存欄位」和「封存所有卡片」選項
- [x] 9.3 修改 `frontend/src/pages/board-detail/BoardPage.tsx`：新增 Archive 按鈕（Archive icon）於工具列，管理 archiveOpen state，渲染 ArchiveDrawer

## 10. i18n

- [x] 10.1 在 `frontend/src/locales/en-US.json` 新增 archive、cardMenu.archive、column.archiveColumn、column.archiveAllCards、toast.archive.\* 相關 key
- [x] 10.2 在 `frontend/src/locales/zh-TW.json` 新增對應的繁體中文翻譯

## 11. Snapshot Middleware

- [x] 11.1 在 `backend/api/middleware/snapshot.go` 的 `mutationRules` 新增 archive 路由規則：
  - `PATCH /api/v1/cards/:id/archive` → trigger: "archive_card", mode: debounce, boardIDFrom: boardIDFromCard
  - `PATCH /api/v1/cards/:id/restore` → trigger: "restore_card", mode: debounce, boardIDFrom: boardIDFromCard
  - `DELETE /api/v1/cards/:id/archive` → trigger: "delete_archived_card", mode: sync, boardIDFrom: boardIDFromCard
  - `PATCH /api/v1/columns/:id/archive` → trigger: "archive_column", mode: debounce, boardIDFrom: boardIDFromColumn
  - `PATCH /api/v1/columns/:id/archive-cards` → trigger: "archive_column_cards", mode: debounce, boardIDFrom: boardIDFromColumn
  - `PATCH /api/v1/columns/:id/restore` → trigger: "restore_column", mode: debounce, boardIDFrom: boardIDFromColumn
  - `DELETE /api/v1/columns/:id/archive` → trigger: "delete_archived_column", mode: sync, boardIDFrom: boardIDFromColumn

## 12. 驗證

- [x] 12.1 執行 `cd backend && go test ./... -v` 確認所有測試通過
- [x] 12.2 執行 `cd frontend && pnpm lint` 確認無 lint 錯誤
- [x] 12.3 執行 `cd frontend && pnpm build` 確認前端編譯無誤
- [x] 12.4 手動測試：右鍵卡片封存、欄位選單封存、Archive Drawer 開啟/切換 tab
- [x] 12.5 手動測試：還原卡片（column 存在、column 已封存兩種情境）
- [x] 12.6 手動測試：還原欄位，確認欄位和未個別封存的 cards 回到看板
- [x] 12.7 手動測試：永久刪除（含確認對話框）卡片和欄位
- [x] 12.8 手動測試：封存卡片後確認不出現在搜尋和釘選清單
- [x] 12.9 手動測試：封存前建立 snapshot，封存後 restore snapshot，確認封存的卡片/欄位回到活躍狀態
- [x] 12.10 手動測試：永久刪除封存項目前確認 snapshot middleware 自動建立 safety-net 快照
