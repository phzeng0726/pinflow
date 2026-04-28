# per-board-tags-and-deps — Tasks

## Group 1: Model

- [x] **1.1** `backend/model/tag.go`：新增 `BoardID uint` 欄位（json: `boardId`）
- [x] **1.2** `backend/model/dependency.go`：新增 `BoardID uint` 欄位（json: `boardId`）

## Group 2: Store — paths & manifest

- [x] **2.1** `backend/store/store.go`：新增 `boardManifestPath(boardID)`、`boardTagsPath(boardID)`、`boardDependenciesPath(boardID)` 路徑方法
- [x] **2.2** 新增 `boardNextIDs map[uint]map[string]uint` 欄位與 `NextBoardID(boardID, name)` 方法；`CreateBoard` 時初始化並寫入 `boards/board-N/manifest.json`
- [x] **2.3** `load()` 中在 boards 走訪迴圈內：讀取 `boards/board-N/manifest.json`、`tags.json`、`dependencies.json`，填入對應 in-memory 索引
- [x] **2.4** 移除舊的 workspace-root `tagsPath()`、`dependenciesPath()` 方法

## Group 3: Store — Tag operations

- [x] **3.1** `CreateTag`：要求 `BoardID != 0`；用 `NextBoardID` 分配 ID；寫入 `boardTagsPath(boardID)`；更新 `tagsByBoard` 索引
- [x] **3.2** `GetTagByName(boardID, name)`：簽章新增 boardID，只在 `tagsByBoard[boardID]` 範圍內做 case-insensitive 查找
- [x] **3.3** `GetTagsByBoard(boardID)` 新方法：回傳指定 board 的所有 tags（sorted by name）
- [x] **3.4** `UpdateTag`：更新後只重寫該 tag 所屬 board 的 `tags.json`
- [x] **3.5** `DeleteTag`：清卡片 `TagIDs` 時只掃該 board 內的卡片；只寫該 board 的 `tags.json`
- [x] **3.6** `AttachTagToCard`：防禦性跨 board 檢查（card board vs tag board），不符回 `ErrCrossBoardTag`
- [x] **3.7** `DeleteBoard`：清掉 `tagsByBoard[id]`，以及 `tags` map 中屬於該 board 的所有 entry

## Group 4: Store — Dependency operations

- [x] **4.1** `CreateDependency`：要求 `BoardID != 0`；驗證 from/to 卡片都屬同 board；用 `NextBoardID` 分配 ID；寫入 `boardDependenciesPath(boardID)`；更新 `depsByBoard` 索引
- [x] **4.2** `ListDependenciesByBoard(boardID)`：改走 `depsByBoard` 索引（O(k)）
- [x] **4.3** `DeleteDependency`：只重寫該 dep 所屬 board 的 `dependencies.json`
- [x] **4.4** `DeleteBoard`：清掉 `depsByBoard[id]` 與 `dependencies` map 中屬於該 board 的 entry
- [x] **4.5** 新增 `BoardIDOfDependency` 改用 `dep.BoardID`
- [x] **4.6** 新增/更新 `persistTags(boardID)` 與 `persistDependencies(boardID)`，改用 per-board 路徑

## Group 5: Repository — Tag

- [x] **5.1** `backend/repository/tag_repository.go`：`CreateOrGet(boardID, name, color)` — boardID-scoped 去重
- [x] **5.2** `backend/repository/tag_repository.go`：`FindByName(boardID, name)` 簽章更新
- [x] **5.3** `backend/repository/tag_repository.go`：`ListByBoard(boardID)` 新方法
- [x] **5.4** 更新 `backend/repository/repository.go` 中的 TagRepository 介面定義

## Group 6: Service

- [x] **6.1** `backend/service/tag_service.go`：`CreateOrGet(boardID, name, color)` — 轉發 boardID 給 repository
- [x] **6.2** `backend/service/tag_service.go`：`ListByBoard(boardID)` 取代 `ListAll`
- [x] **6.3** `backend/service/tag_service.go`：`AttachToCard(cardID, tagID)` — 抓 card 所屬 board 與 tag.BoardID，不同回 `ErrCrossBoardTag`
- [x] **6.4** `backend/service/tag_service.go`：`UpdateTag` 更新 name 唯一性檢查改為在 `tag.BoardID` 範圍內
- [x] **6.5** `backend/service/dependency_service.go`：`CreateForCard` — 抓兩張卡 board，不同回 `ErrCrossBoardDependency`；設 `dep.BoardID` 後 `Create`
- [x] **6.6** 更新 `backend/service/service.go` 中 TagService 介面定義

## Group 7: API / Handler

- [x] **7.1** `backend/api/tag_handler.go`：移除 `ListTags`、`CreateTag`；新增 `ListBoardTags(c)`、`CreateBoardTag(c)` 讀取 `:id` 作為 boardID
- [x] **7.2** `backend/api/dependency_handler.go`：跨 board 錯誤 → 回 HTTP 422
- [x] **7.3** `backend/api/card_handler.go`：`SearchCards` 接受可選 `?board_id=` query，有值時過濾 service 回傳結果
- [x] **7.4** `backend/api/router.go`：`tags` group 只剩 `PATCH /:id`、`DELETE /:id`；`boards` group 新增 `GET /:id/tags`、`POST /:id/tags`
- [x] **7.5** `cd backend && swag init` 重新產生 Swagger 文件

## Group 8: Snapshot

- [x] **8.1** `backend/service/snapshot_service.go`：`copyBoardToSnapshot` — 直接 copyFile per-board 檔案，移除舊的 tag 子集過濾邏輯
- [x] **8.2** `mergeTags`：改為覆寫 `boards/board-N/tags.json`，更新 `tagsByBoard` in-memory 索引
- [x] **8.3** `restoreDependencies`：直接覆寫 `boards/board-N/dependencies.json`，移除「其他 board 保留」邏輯
- [x] **8.4** `bumpNextIDs`：從 snapshot 的 board `manifest.json` 讀取 tag/dep 最大 ID，更新 board 的 `manifest.json`
- [x] **8.5** 確認 `ReloadBoard` 會重讀 board 的 per-board `manifest.json`、`tags.json`、`dependencies.json`

## Group 11: Tests

- [x] **11.1** 新增 tag attach 跨 board 被拒的 service 測試
- [x] **11.2** 新增 dependency create 跨 board 被拒的 service 測試
- [x] **11.3** 新增 per-board tag CRUD 測試
- [x] **11.4** handler 層跨 board POST `/cards/:id/dependencies` 回 422 測試
- [x] **11.5** handler 層跨 board POST `/cards/:id/tags` 回 422 測試
- [x] **11.6** `cd backend && go test ./... -v` 全部通過

## Group 9: Frontend — API & Hooks

- [x] **9.1** `frontend/src/lib/api/tags.ts`：新增 `listBoardTags(boardId)` → `GET /boards/${boardId}/tags`；新增 `createBoardTag(boardId, payload)` → `POST /boards/${boardId}/tags`；移除或標記棄用 `listTags`、`createTag`
- [x] **9.2** `frontend/src/lib/api/cards.ts`：`searchCards` 加可選 `boardId` 參數，有值時帶 `?board_id=`
- [x] **9.3** `frontend/src/hooks/queryKeys.ts`：`tags.byBoard(boardId)` 取代 `tags.all()`；`cards.search` key 加 `boardId` 維度
- [x] **9.4** `frontend/src/hooks/tag/queries/useBoardTags.ts`：改為接受 `boardId`，呼叫 `listBoardTags`
- [x] **9.5** `frontend/src/hooks/tag/mutations/useTagMutations.ts`：`createTag` 帶 boardId，invalidate `tags.byBoard(boardId)` 而非 `tags.all()`
- [x] **9.6** `frontend/src/hooks/dependency/queries/useCardSearch.ts`：接受 `boardId` 參數，傳給 `searchCards`，納入 queryKey

## Group 10: Frontend — UI Components

- [x] **10.1** `frontend/src/pages/board-detail/components/cards/TagsPopover.tsx`：`useBoardTags(boardId)` 取代 `useTags()`；新增 tag 時帶 boardId
- [x] **10.2** `frontend/src/pages/board-detail/components/cards/DependencyPopover.tsx`：`useCardSearch` 搜尋目標卡時傳入當前 boardId

## Group 11 (continued): Frontend Tests

- [x] **11.7** `cd frontend && pnpm test && pnpm lint` 全部通過
