## 1. Repository 層重構

- [x] 1.1 git mv `file_board_repository.go` → `board_repository.go`
- [x] 1.2 git mv `file_card_repository.go` → `card_repository.go`
- [x] 1.3 git mv `file_column_repository.go` → `column_repository.go`
- [x] 1.4 git mv `file_tag_repository.go` → `tag_repository.go`
- [x] 1.5 git mv `file_checklist_repository.go` → `checklist_repository.go`
- [x] 1.6 git mv `file_checklist_item_repository.go` → `checklist_item_repository.go`
- [x] 1.7 git mv `file_dependency_repository.go` → `dependency_repository.go`
- [x] 1.8 git mv `file_comment_repository.go` → `comment_repository.go`
- [x] 1.9 各檔案將 struct 與 constructor 改為 package-private（`fileBoardRepository` → `boardRepository`，`NewFileBoardRepository` → `newBoardRepository`，其餘 7 個同理）
- [x] 1.10 新增 `repository/repository.go`：定義 `Repositories` struct 與 `NewRepositories(fs *store.FileStore) *Repositories`

## 2. Service 層重構

- [x] 2.1 新增 `service/interfaces.go`：將 `BoardService`、`ColumnService`、`CardService`、`TagService`、`ChecklistService`、`DependencyService`、`CommentService`、`ImageService` 所有 interface 移入
- [x] 2.2 `service/board_service.go`：移除 interface 定義，`NewBoardService` → `newBoardService`
- [x] 2.3 `service/column_service.go`：移除 interface 定義，`NewColumnService` → `newColumnService`
- [x] 2.4 `service/card_service.go`：移除 interface 定義，`NewCardService` → `newCardService`
- [x] 2.5 `service/tag_service.go`：移除 interface 定義，`NewTagService` → `newTagService`
- [x] 2.6 `service/checklist_service.go`：移除 interface 定義，`NewChecklistService` → `newChecklistService`
- [x] 2.7 `service/dependency_service.go`：移除 interface 定義，`NewDependencyService` → `newDependencyService`
- [x] 2.8 `service/comment_service.go`：移除 interface 定義，`NewCommentService` → `newCommentService`
- [x] 2.9 `service/image_service.go`：移除 interface 定義，`NewImageService` → `newImageService`
- [x] 2.10 新增 `service/service.go`：定義 `Deps` struct（`Repos *repository.Repositories`、`Store *store.FileStore`）、`Services` struct、`NewServices(deps Deps) *Services`（內部建立 imageSvc 並注入 cardSvc 和 commentSvc）

## 3. Handler 層重構

- [x] 3.1 新增 `api/handler.go`：定義 `Handlers` struct（含所有 handler 欄位）與 `NewHandlers(services *service.Services) *Handlers`
- [x] 3.2 `api/board_handler.go`：struct 欄位 `svc service.BoardService` → `services *service.Services`，所有 `h.svc.` 改為 `h.services.Board.`，移除 `NewBoardHandler`
- [x] 3.3 `api/column_handler.go`：同上，改用 `h.services.Column.`，移除 `NewColumnHandler`
- [x] 3.4 `api/card_handler.go`：同上，改用 `h.services.Card.`，移除 `NewCardHandler`
- [x] 3.5 `api/tag_handler.go`：同上，改用 `h.services.Tag.`，移除 `NewTagHandler`
- [x] 3.6 `api/checklist_handler.go`：同上，改用 `h.services.Checklist.`，移除 `NewChecklistHandler`
- [x] 3.7 `api/checklist_item_handler.go`：同上，改用 `h.services.Checklist.`，移除 `NewChecklistItemHandler`
- [x] 3.8 `api/dependency_handler.go`：同上，改用 `h.services.Dependency.`，移除 `NewDependencyHandler`
- [x] 3.9 `api/comment_handler.go`：同上，改用 `h.services.Comment.`，移除 `NewCommentHandler`
- [x] 3.10 `api/image_handler.go`：同上，改用 `h.services.Image.`，移除 `NewImageHandler`
- [x] 3.11 `api/router.go`：`NewRouter` 參數改為 `(h *Handlers)`，路由綁定改用 `h.Board.`、`h.Card.` 等，移除 `RouterDeps` struct

## 4. main.go 與接線

- [x] 4.1 簡化 `main.go`：`NewRepositories(fs)` → `NewServices(deps)` → `NewHandlers(services)` → `NewRouter(handlers)`

## 5. 測試更新

- [x] 5.1 `tests/handler_test.go`：`setupRouter()` 改用 `NewRepositories` + `NewServices` + `NewHandlers`，移除所有個別 `NewFile*Repository` 呼叫
- [x] 5.2 `tests/repository_test.go`：helper 函式若有用到個別 constructor 則更新
- [x] 5.3 `tests/service_test.go`：更新 service setup helper
- [x] 5.4 `tests/dependency_handler_test.go`：更新 setup
- [x] 5.5 `tests/dependency_repository_test.go`：更新 setup
- [x] 5.6 `tests/dependency_service_test.go`：更新 `setupDepService()`，改用容器取得 repos
- [x] 5.7 `tests/image_test.go`：更新 setup
- [x] 5.8 `tests/rich_fields_test.go`：更新 setup
- [x] 5.9 `tests/card_search_test.go`：更新 setup

## 6. 驗證

- [x] 6.1 執行 `cd backend && go build ./...` 確認編譯通過
- [x] 6.2 執行 `cd backend && go test ./... -v` 確認所有測試通過
- [x] 6.3 執行 `cd backend && go run . --workspace ../../pinflow-workspace` 確認伺服器正常啟動
