## 1. Backend — Data Model & Storage

- [x] 1.1 新增 `backend/model/dependency.go`（DependencyType 常數、Dependency struct）
- [x] 1.2 在 `backend/store/store.go` 新增 `dependencies map[uint]*model.Dependency`、`dependencyIdSeq`，更新 manifest 序列化
- [x] 1.3 在 `FileStore` 新增 `dependenciesPath()`、`loadDependencies()`，在 `NewFileStore` 中初始化並載入
- [x] 1.4 實作 `FileStore.CreateDependency`（含自引用檢查、重複檢查、related_to 雙向重複檢查）
- [x] 1.5 實作 `FileStore.DeleteDependency`
- [x] 1.6 實作 `FileStore.ListDependenciesByCard`（同時撈 from 與 to 兩側）
- [x] 1.7 實作 `FileStore.CountDependenciesByCard`
- [x] 1.8 在 `FileStore.DeleteCard` 中呼叫 `cleanDependenciesByCard`（同一把 mutex）

## 2. Backend — Repository & DTO

- [x] 2.1 在 `backend/repository/interfaces.go` 新增 `DependencyRepository` interface
- [x] 2.2 新增 `backend/repository/file_dependency_repository.go`，實作所有 interface 方法
- [x] 2.3 新增 `backend/dto/dependency_dto.go`（CreateDependencyRequest、DependencyResponse、DependencyCardRef、CardSearchResponse）

## 3. Backend — Service

- [x] 3.1 新增 `backend/service/dependency_service.go`（DependencyService interface + 實作），`CreateForCard` 含卡片存在性驗證、組裝回應
- [x] 3.2 在 `backend/service/card_service.go` 新增 `Search(query string, limit int)` 方法（附 board/column meta）
- [x] 3.3 在 `CardService.GetCardDetail` 填入 `DependencyCount`
- [x] 3.4 在 `BoardService`（或對應方法）組裝 board cards 時填入 `DependencyCount`

## 4. Backend — Handler & Router

- [x] 4.1 新增 `backend/api/dependency_handler.go`（Create、ListByCard、Delete）含 swagger godoc
- [x] 4.2 在 `backend/api/card_handler.go` 新增 `SearchCards` handler 含 swagger godoc
- [x] 4.3 在 `backend/dto/card_dto.go` 或 `CardResponse` 新增 `DependencyCount int` 欄位
- [x] 4.4 更新 `backend/api/router.go`：`/cards/search`（在 `/:id` 前）、`/cards/:id/dependencies`、`/dependencies/:id`
- [x] 4.5 更新 `backend/main.go` wiring（depRepo、depService、depHandler）

## 5. Backend — Tests & Swagger

- [x] 5.1 新增 `backend/tests/dependency_repository_test.go`
- [x] 5.2 新增 `backend/tests/dependency_service_test.go`（建立、雙向列出、刪 card 連帶清理、自引用拒絕、重複拒絕、related_to 雙向重複拒絕）
- [x] 5.3 新增 `backend/tests/dependency_handler_test.go`
- [x] 5.4 新增 `backend/tests/card_search_test.go`
- [x] 5.5 執行 `cd backend && swag init` 重新產生 Swagger 文件

## 6. Frontend — Types & Config

- [x] 6.1 在 `frontend/src/types/index.ts` 新增 `DependencyType`、`DependencyCardRef`、`Dependency`、`CardSearchResult` 型別；在 `Card` 新增 `dependencyCount: number`
- [x] 6.2 在 `frontend/src/pages/board-detail/components/styleConfig.ts` 新增 `DEPENDENCY_RELATIONS` 陣列和 `resolveDependencyView` helper

## 7. Frontend — API & Hooks

- [x] 7.1 新增 `frontend/src/lib/api/dependencies.ts`（listDependencies、createDependency、deleteDependency）
- [x] 7.2 在 `frontend/src/lib/api/cards.ts` 新增 `searchCards`；在 `lib/api/index.ts` re-export
- [x] 7.3 在 `frontend/src/hooks/queryKeys.ts` 新增 `dependencies.byCard` 和 `cards.search` 鍵
- [x] 7.4 新增 `frontend/src/hooks/dependency/queries/useDependencies.ts`
- [x] 7.5 新增 `frontend/src/hooks/dependency/queries/useCardSearch.ts`（debounced）
- [x] 7.6 新增 `frontend/src/hooks/dependency/mutations/useDependencyMutations.ts`（createDep、deleteDep，含 invalidate）

## 8. Frontend — DependencyPopover

- [x] 8.1 新增 `frontend/src/pages/board-detail/components/cards/DependencyPopover.tsx`
- [x] 8.2 實作 Step 1（select-relation view）：6 個選項列表，各有 icon、label、description
- [x] 8.3 實作 Step 2（pick-card view）：返回箭頭、搜尋輸入、結果列表（title + board/column meta）
- [x] 8.4 實作底部 sticky preview bar：選好關係和目標卡後顯示「A → 關係 → B」
- [x] 8.5 確認送出時依 `flip` 決定正確的 from/to 方向；popover 關閉後清空狀態

## 9. Frontend — CardDetailDialog & CardItem

- [x] 9.1 在 `CardDetailDialog.tsx` 新增 Dependencies 區塊：用 `useDependencies` 取資料，用 `resolveDependencyView` 展開顯示 label + other card
- [x] 9.2 為每條 dependency 渲染 Badge（relation label + other card title）+ X 移除按鈕
- [x] 9.3 在 Dependencies 區塊尾端放 `<DependencyPopover boardId={boardId} card={card} />`
- [x] 9.4 在 `CardItem.tsx` meta 列新增：`card.dependencyCount > 0` 時顯示 `<Link2 />` icon + 數量

## 10. Verification

- [x] 10.1 執行 `cd backend && go test ./tests/... -v` 確認全部通過
- [x] 10.2 啟動後端，curl 測試 create/list/delete dependency 端點及 search 端點
- [x] 10.3 執行 `cd frontend && pnpm build` 確認無 TypeScript 錯誤
- [x] 10.4 前端互動測試：開 CardDetailDialog → 新增 dependency → 確認 preview bar 正確 → 確認送出後雙端都顯示 → 移除 dependency → 確認消失 → 刪除卡片 → 確認另一端 dependency 也消失
- [x] 10.5 確認 board 小卡 meta 列正確顯示 link icon + dependency 計數
