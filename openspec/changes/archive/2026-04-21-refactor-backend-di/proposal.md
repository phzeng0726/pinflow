## Why

目前後端每層（repository / service / handler）的建構全部散落在 `main.go`，每次新增 domain 都要手動加 8+ 行接線程式碼，且 test setup 也需要重複同樣的樣板。將各層包裝成容器 struct（`Repositories` / `Services` / `Handlers`）並提供單一 `New` 函式，可大幅簡化接線邏輯並提高可維護性。

## What Changes

- **BREAKING** `repository.NewFile*Repository()` 全部改為 package-private（`new*Repository()`），外部不再直接呼叫個別 constructor
- **BREAKING** `service.New*Service()` 全部改為 package-private，外部改用 `service.NewServices(deps)`
- **BREAKING** `api.NewXxxHandler(svc)` 全部移除，改用 `api.NewHandlers(services)`
- **BREAKING** `api.NewRouter()` 參數由 9 個獨立 handler 改為 `*Handlers`
- Repository 檔名移除 `file_` 前綴（`file_board_repository.go` → `board_repository.go`，共 8 個）
- 新增 `repository/repository.go`：`Repositories` struct + `NewRepositories(fs)`
- 新增 `service/interfaces.go`：集中所有 service interface
- 新增 `service/service.go`：`Services` struct + `Deps` struct + `NewServices(deps)`
- 新增 `api/handler.go`：`Handlers` struct + `NewHandlers(services)`
- `main.go` 簡化為 4 行接線
- `tests/` 所有 setup 函式更新，移除個別 repo/service constructor 呼叫

## Capabilities

### New Capabilities

- `backend-di-container`: 後端 DI 容器架構——repository / service / handler 三層各自有聚合 struct 與單一 `New` 函式，外部只需透過容器存取各層實例

### Modified Capabilities

（無 spec-level 行為變更，API contract 與功能不改變）

## Impact

- **受影響檔案**：`backend/repository/*.go`（8 個）、`backend/service/*.go`（8 個）、`backend/api/*.go`（10 個）、`backend/main.go`、`backend/tests/*.go`（9 個）
- **外部 API**：無變更（所有 HTTP endpoint 保持不變）
- **測試**：所有現有測試需更新 setup，但測試邏輯不變
- **依賴**：無新增第三方依賴
