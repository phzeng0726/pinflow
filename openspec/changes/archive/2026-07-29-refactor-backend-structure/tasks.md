## 1. 建立集中式測試基礎設施

- [x] 1.1 建立 `backend/tests/api/`、`repository/`、`seed/`、`service/`、`store/`、`sync/` 與 `testutil/` package 結構。
- [x] 1.2 在 `testutil` 新增可重用的暫存 workspace、`FileStore`、service container、API router、已認證 sync 狀態及 cleanup helper。
- [x] 1.3 新增可設定的 Supabase `httptest.Server` helper，記錄 request 並支援 auth、REST 成功、失敗與重試 response。

## 2. 將 Store 通知改為 instance-owned

- [x] 2.1 將 notifier 狀態加入 `FileStore`，並從 `backend/store/io.go` 移除 package-level notifier、base path 與 package-level setter。
- [x] 2.2 讓 JSON persistence 經由 `FileStore` receiver 執行，使成功寫入能在該 instance 的 channel 發送 workspace 相對路徑通知。
- [x] 2.3 更新刪除通知流程以使用所屬 `FileStore` channel，同時保留非阻塞傳送與 `delete:<relative-path>` 行為。
- [x] 2.4 新增集中式黑箱測試，涵蓋寫入通知、channel 已滿、未設定 notifier、刪除通知，以及兩個 Store 之間的隔離。

## 3. 建立 Cloud Sync 依賴邊界

- [x] 3.1 定義 `Manager` 所需的最小 cloud client interface，並保留現有正式 REST client 作為預設實作。
- [x] 3.2 為 Supabase REST client 加入 HTTP client 注入，且不改變認證 header、401 refresh 或 PostgREST request 行為。
- [x] 3.3 為 cloud client、debounce interval、reconciliation interval、retry interval 與可控制的 full-sync 執行加入明確的 Manager 依賴設定，同時保留正式環境預設值。
- [x] 3.4 重構 Supabase 設定解析，讓 embedded default 與 environment lookup 可透過具正式用途的公開 API 測試，且不修改 package 私有全域變數。
- [x] 3.5 更新 `main.go` 與 handler/test 組裝以使用正式 constructor，並確認 Manager graceful shutdown 行為維持不變。

## 4. 搬移並統一後端測試

- [x] 4.1 將 `backend/api/auth_handler_test.go` 與 `backend/api/sync_handler_test.go` 搬至 `backend/tests/api/`，並改為黑箱 API 測試。
- [x] 4.2 將 `backend/seed/seed_test.go` 搬至 `backend/tests/seed/`，並保留其 seed workspace assertion。
- [x] 4.3 將 `backend/store/notification_test.go` 與 `backend/store/workspace_replace_test.go` 搬至 `backend/tests/store/`，以公開 Store 行為取代私有 helper 呼叫。
- [x] 4.4 將 `backend/sync/client_test.go`、`config_test.go` 與 `manager_test.go` 搬至 `backend/tests/sync/`，並改用新的依賴邊界取代私有欄位存取。
- [x] 4.5 將現有根層級的 `backend/tests/*_test.go` 重新整理至 API、repository、service、store 與 sync 領域目錄，並合併重複的 setup helper。
- [x] 4.6 遞迴確認 `backend/` 下除了 `backend/tests/` 以外不再存在任何 `*_test.go` 檔案。

## 5. 拆分 FileStore 實作

- [x] 5.1 將 FileStore 型別、建構、workspace 載入／重新載入、manifest 處理與 persistence helper 搬至職責明確的 Store 檔案。
- [x] 5.2 將 board、column 與 card 操作從 `store.go` 搬至對應的領域檔案，且不改變公開簽章或 locking 行為。
- [x] 5.3 將 tag、checklist、checklist-item、comment 與 dependency 操作搬至對應的領域檔案。
- [x] 5.4 將 snapshot、settings、archive、index、copy 與 path helper 搬至職責明確的檔案，並移除 `store.go` 中已清空的區段。
- [x] 5.5 拆分後執行格式化與完整後端測試套件，並確認 workspace JSON 輸出仍與現有 fixture 相容。

## 6. 將 Supabase Schema 版本化

- [x] 6.1 建立可重複安全套用的 `supabase/migrations/<timestamp>_create_workspace_files.sql` migration，包含既有 table、key、foreign key、RLS 與使用者隔離 policy 定義。
- [x] 6.2 確認 migration 可納管等效的手動建置 schema，且不刪除或修改既有 `workspace_files` 資料列。
- [x] 6.3 在版本化 migration 完整包含 schema 契約後，移除 `backend/sync/schema.sql`。
- [x] 6.4 在 README 記錄新 project 的 migration 套用方式、既有 project 納管流程，以及應用程式不具執行期 migration 權限。

## 7. 文件與驗證

- [x] 7.1 更新後端開發說明，將從 `backend/` 執行的 `go test ./...` 設為具權威性的完整測試套件命令。
- [x] 7.2 對所有變更的 Go 檔案執行 `gofmt`，並從 `backend/` 執行 `go test ./... -v`。
- [x] 7.3 確認既有 HTTP route、DTO、workspace fixture 與 Supabase REST path 未因重構而改變。
- [x] 7.4 對 `refactor-backend-structure` 執行 OpenSpec 驗證，並修正所有 artifact 或 requirement 錯誤。

## 8. 驗證修正

- [x] 8.1 將仍留在 `store.go` 的 FileStore 型別、建構與 workspace 載入邏輯移至職責明確的檔案。
- [x] 8.2 將 `integration/` 測試依 API、repository 與 service 領域整理，並統一使用共用 Supabase mock helper。
- [x] 8.3 新增 migration 對全新與既有 schema 的自動驗證，並在 README 補充具體 Supabase CLI 操作。
- [x] 8.4 執行格式化、完整後端測試與 OpenSpec strict 驗證，確認所有驗證警告均已處理。
