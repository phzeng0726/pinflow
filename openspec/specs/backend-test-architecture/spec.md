# backend-test-architecture Specification

## Purpose
TBD - created by archiving change refactor-backend-structure. Update Purpose after archive.
## Requirements
### Requirement: 集中式後端測試位置
所有後端 Go 測試檔案必須（MUST）位於 `backend/tests/` 或其依領域劃分的子目錄中。`backend/` 下的正式程式 package 目錄不得（SHALL NOT）包含 `*_test.go` 檔案。

#### Scenario: 檢查儲存庫測試佈局
- **WHEN** 維護者遞迴搜尋後端中符合 `*_test.go` 的檔案
- **THEN** 每個符合的檔案都位於 `backend/tests/` 之下

#### Scenario: 新增後端測試
- **WHEN** 貢獻者新增 API、service、repository、store、sync 或 seed 行為的測試
- **THEN** 該測試放置於 `backend/tests/` 下對應的領域目錄

### Requirement: 黑箱 package 邊界
後端測試必須（MUST）透過已匯出的 package API 與可觀察結果驗證正式程式行為。正式程式 package 不得（SHALL NOT）僅為了讓測試存取內部狀態，而暴露測試專用變數、函式、build-tag adapter 或可變的全域 hook。

#### Scenario: 內部行為需要回歸測試
- **WHEN** 問題源自未匯出的 helper 或私有欄位
- **THEN** 測試透過公開操作觸發該行為，並驗證其外部可觀察結果

#### Scenario: 測試需要控制依賴
- **WHEN** 測試需要控制 HTTP transport、時間、重試、設定或通知行為
- **THEN** 該依賴透過具正式程式用途的 constructor 或依賴設定提供，而不是修改 package 私有狀態

### Requirement: 隔離且可重用的測試 fixture
後端測試必須（SHALL）使用隔離的暫存 workspace，以及各自獨立持有的可變依賴。Store、router、已認證 session 與 Supabase mock server 的可重用建構流程，必須（MUST）由 `backend/tests/testutil/` 下的共用 helper 提供。

#### Scenario: 同一 process 執行多個 Store 測試
- **WHEN** 兩個測試建立不同的 `FileStore` instance
- **THEN** 任一 instance 的 notifier 設定與檔案操作不會影響另一個 instance

#### Scenario: 測試執行完畢
- **WHEN** 使用 workspace、HTTP server、channel 或背景 manager 的測試結束
- **THEN** 其資源透過測試 cleanup 釋放，且不需要另一個測試重設 package 全域狀態

### Requirement: 完整後端測試命令
從 `backend/` 執行的 `go test ./...` 必須（MUST）是文件記載且具權威性的完整後端測試套件命令。

#### Scenario: 執行完整後端測試套件
- **WHEN** 開發者或 CI job 從 `backend/` 執行 `go test ./...`
- **THEN** `backend/tests/` 下的每個後端測試都會被找到並執行

#### Scenario: 閱讀後端測試文件
- **WHEN** 貢獻者遵循儲存庫的後端測試說明
- **THEN** 說明使用 `go test ./...`，且不會將 `go test ./tests/...` 描述為完整測試套件的替代命令
