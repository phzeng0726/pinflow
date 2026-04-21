## Context

後端目前採用手動建構式注入（manual constructor injection），所有接線邏輯集中在 `main.go`。每個 repository 以 `NewFile*Repository(fs)` 建立，每個 service 以 `New*Service(repo1, repo2, ...)` 建立，每個 handler 以 `NewXxxHandler(svc)` 建立，最終傳入 `NewRouter(h1, h2, ..., h9)`。

現有痛點：
- `main.go` 需要 30+ 行接線，每新增 domain 就要改動多處
- 測試 setup（`setupRouter()`、`setupDepService()` 等）重複同樣樣板
- Handler 只能透過 `h.svc` 存取單一 service，若需跨 service 操作需另外注入

## Goals / Non-Goals

**Goals:**
- 將 repository 層包裝為 `Repositories` struct，提供 `NewRepositories(fs)` 單一入口
- 將 service 層包裝為 `Services` struct，提供 `NewServices(deps)` 單一入口
- 將 handler 層包裝為 `Handlers` struct，提供 `NewHandlers(services)` 單一入口
- Handler 透過 `h.services.XXX` 存取任意 service，不受限於 constructor 參數
- 簡化 `main.go` 接線至 4 行，測試 setup 同步簡化
- 移除 `file_` 前綴，因為只有一種 storage 模式

**Non-Goals:**
- 引入 DI 框架（如 wire、dig）—— 保持手動顯式注入
- 改變任何 HTTP API 端點或行為
- 新增功能或修改商業邏輯
- 前端變更

## Decisions

### D1：容器 struct 而非 DI 框架

**決定**：用手動的 `Repositories` / `Services` / `Handlers` struct，不引入 wire 或 dig。

**理由**：專案規模小（8 個 domain），手動接線完全可控且無魔法依賴。引入 DI 框架會增加學習成本與 build 複雜度，收益不成比例。

**替代方案**：wire（Google）或 dig（Uber）—— 排除，因為 code generation 或 reflection 對此規模過度設計。

---

### D2：Repository constructor 改為 package-private

**決定**：`NewFileBoardRepository` → `newBoardRepository`（小寫）。

**理由**：外部呼叫者只應透過 `NewRepositories(fs)` 取得 repo，無需知道具體實作。隱藏 constructor 強制使用容器，避免繞過。

**影響**：`tests/` 需改用 `repos.Board` 等欄位，不再直接呼叫 `NewFile*Repository`。

---

### D3：Service constructor 改為 package-private

**決定**：`NewBoardService` → `newBoardService`（小寫），全部集中到 `service/service.go` 的 `NewServices(deps)`。

**理由**：與 D2 同理，強制統一入口。`Deps` struct 封裝跨 service 的共用依賴（`*store.FileStore`）。

**特殊情況**：
- `ImageService` 需要 `basePath string`，從 `fs.BasePath()` 取得，在 `NewServices` 內部建立，再注入 `CardService` 和 `CommentService`
- `CommentService` 需要 `*store.FileStore`（用於 `WorkspaceID()`），透過 `Deps.Store` 傳入

---

### D4：Handler 共用同一個 `*service.Services`

**決定**：所有 handler 的 struct 欄位從 `svc service.XyzService` 改為 `services *service.Services`。

**理由**：未來若某 handler 需要存取額外 service（如 `CardHandler` 需要 `ImageService`），不需修改 constructor，直接透過 `h.services.Image` 呼叫。

**取捨**：每個 handler 能看到所有 service，違反最小知識原則；但對此規模，簡潔性優先。

---

### D5：Router 改接收 `*Handlers`

**決定**：`NewRouter(h *Handlers)` 取代原本 9 個獨立參數，移除 `RouterDeps` struct。

**理由**：`RouterDeps` 與 `Handlers` 功能重複，合一即可。

## Risks / Trade-offs

- [測試破壞] 所有 test setup 需更新 → 遷移時一次性修改，不影響測試邏輯本身
- [Nil panic] `ImageService` 在測試中可能為 nil（現有 test 傳 nil）→ 維持原有 nil 守衛（`if s.imageSvc != nil`），測試傳 `nil` 時 `NewServices` 不建立 imageSvc（待確認：測試可直接用 `NewRepositories` + `NewServices` 並讓 imageSvc 正常建立，避免 nil）
- [Handler 過度暴露] Handler 能存取所有 service → 可接受，因本專案 handler 邏輯單純

## Migration Plan

1. git mv 8 個 repository 檔案（移除 `file_` 前綴）
2. 新增 `repository/repository.go`（`Repositories` + `NewRepositories`）
3. 各 repo 檔案 struct/constructor 改 private
4. 新增 `service/interfaces.go`（集中 interface）
5. 新增 `service/service.go`（`Services` + `Deps` + `NewServices`）
6. 各 service 檔案移除 interface、constructor 改 private
7. 各 handler 檔案 struct 改用 `services *service.Services`
8. 新增 `api/handler.go`（`Handlers` + `NewHandlers`）
9. 更新 `api/router.go`（接收 `*Handlers`）
10. 簡化 `main.go`
11. 更新 `tests/` 所有 setup 函式
12. `go build ./...` + `go test ./...` 驗證

**Rollback**：變更均在同一 branch，任何時間點可 `git revert`。無資料遷移。

## Open Questions

（無）
