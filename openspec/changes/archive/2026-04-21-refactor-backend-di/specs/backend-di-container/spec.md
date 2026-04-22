## ADDED Requirements

### Requirement: Repositories container
後端 repository 層 SHALL 提供一個 `Repositories` struct，包含所有 domain repository 欄位，並透過 `NewRepositories(fs *store.FileStore) *Repositories` 單一函式建立所有 repository 實例。個別 repository constructor SHALL 為 package-private。

#### Scenario: 透過容器存取 repository
- **WHEN** 呼叫 `repository.NewRepositories(fs)`
- **THEN** 回傳包含所有 repository 實例的 `*Repositories`（Board、Column、Card、Tag、Checklist、ChecklistItem、Dependency、Comment 欄位皆非 nil）

#### Scenario: 無法直接呼叫個別 constructor
- **WHEN** 外部程式嘗試呼叫 `repository.newBoardRepository(fs)`（或其他小寫 constructor）
- **THEN** 編譯失敗（package-private）

---

### Requirement: Services container
後端 service 層 SHALL 提供一個 `Services` struct，包含所有 domain service 欄位，並透過 `NewServices(deps Deps) *Services` 單一函式建立所有 service 實例。`Deps` struct SHALL 包含 `Repos *repository.Repositories` 與 `Store *store.FileStore`。個別 service constructor SHALL 為 package-private。

#### Scenario: 透過容器存取 service
- **WHEN** 呼叫 `service.NewServices(deps)` 並傳入有效的 `Deps`
- **THEN** 回傳包含所有 service 實例的 `*Services`（Board、Column、Card、Tag、Checklist、Dependency、Comment、Image 欄位皆非 nil）

#### Scenario: ImageService 自動建立並注入
- **WHEN** 呼叫 `service.NewServices(deps)`
- **THEN** `ImageService` 在容器內部以 `deps.Store.BasePath()` 建立，並注入 `CardService` 與 `CommentService`，無需外部傳入

---

### Requirement: Handlers container
後端 handler 層 SHALL 提供一個 `Handlers` struct，包含所有 domain handler 欄位，並透過 `NewHandlers(services *service.Services) *Handlers` 單一函式建立所有 handler 實例。每個 handler struct SHALL 持有 `services *service.Services`，透過 `h.services.XXX` 存取任意 service。

#### Scenario: 透過容器存取 handler
- **WHEN** 呼叫 `api.NewHandlers(services)`
- **THEN** 回傳包含所有 handler 實例的 `*Handlers`，每個 handler 的 `services` 欄位指向同一個 `*service.Services`

#### Scenario: Handler 存取跨 domain service
- **WHEN** handler 方法需要呼叫任意 service（如 `CardHandler` 呼叫 `h.services.Image.Upload()`）
- **THEN** 可直接透過 `h.services.XXX` 呼叫，無需額外 constructor 參數

---

### Requirement: Router 接收 Handlers 容器
`api.NewRouter` SHALL 接收 `*Handlers` 作為唯一參數，不再接收多個獨立 handler 參數。`RouterDeps` struct SHALL 被移除。

#### Scenario: 以容器建立 router
- **WHEN** 呼叫 `api.NewRouter(handlers)`
- **THEN** 建立 Gin engine 並正確綁定所有路由

---

### Requirement: Repository 檔名不含 file_ 前綴
repository 層所有實作檔案 SHALL 以 domain 名稱命名（如 `board_repository.go`），不使用 `file_` 前綴。

#### Scenario: 檔案命名一致性
- **WHEN** 查看 `backend/repository/` 目錄
- **THEN** 所有實作檔案命名格式為 `<domain>_repository.go`，不存在 `file_<domain>_repository.go`

---

### Requirement: Service interfaces 集中管理
所有 service interface SHALL 定義於 `service/interfaces.go`，個別 service 檔案不再包含 interface 定義。

#### Scenario: Interface 集中於單一檔案
- **WHEN** 查看 `backend/service/` 目錄
- **THEN** `interfaces.go` 包含 BoardService、ColumnService、CardService、TagService、ChecklistService、DependencyService、CommentService、ImageService 所有 interface 定義
