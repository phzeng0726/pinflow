## Why

後端測試目前同時散落在業務 package 與 `backend/tests/`，部分測試直接依賴未匯出欄位、全域狀態及固定時間設定，使測試位置、執行方式與隔離性不一致。Supabase schema 也以未被工具引用的單一 SQL 檔放在 Go package 中，無法清楚表達其版本、套用順序與部署責任，因此需要一次結構性整理來建立可維護、可重現的後端開發基線。

## What Changes

- 將 `backend/api/`、`backend/seed/`、`backend/store/` 與 `backend/sync/` 內的測試統一移至 `backend/tests/`，並依 API、service、repository、store、sync、seed 等領域組織。
- 將集中後的測試改為透過公開行為進行驗證，抽取共用的 workspace、router 與 Supabase HTTP mock 測試工具，避免測試直接操作 package 私有狀態。
- 將完整後端測試命令統一為 `go test ./...`，更新相關開發文件，確保不會因只執行 `./tests/...` 而遺漏 package。
- 移除 Store persistence notifier 的 package-level 全域狀態，改由各 `FileStore` 實例持有通知依賴，避免多 workspace 或平行測試互相污染。
- 為 cloud sync 的 HTTP transport、同步週期、重試週期與背景工作提供明確的依賴注入邊界，使同步行為可以用黑箱測試穩定驗證。
- 依儲存領域拆分過大的 `backend/store/store.go`，保留既有公開行為與 workspace JSON 格式。
- 將 `backend/sync/schema.sql` 移出 Go package，改為具有版本編號的 Supabase migration，並補充初始化與套用文件；資料表、主鍵、外鍵及 RLS 行為維持不變。
- 不變更既有 HTTP API、前端契約、workspace JSON 格式或雲端同步資料內容。

## Capabilities

### New Capabilities

- `backend-test-architecture`: 定義後端測試的集中式目錄、完整測試入口、黑箱測試邊界、共用測試工具與測試隔離要求。

### Modified Capabilities

- `cloud-sync`: 增加 Supabase 資料庫 schema 必須以版本化 migration 保存並提供可重現套用方式的要求，同時維持既有 `workspace_files` 與 RLS 契約。

## Impact

- 受影響程式碼：`backend/tests/`、現有各 package 的 `*_test.go`、`backend/store/`、`backend/sync/`。
- 受影響基礎設施：新增 Supabase migration 目錄，移除原本位於 `backend/sync/` 的手動 schema 檔案。
- 受影響文件與工具：README、後端測試命令及 Supabase 初始化說明。
- 不新增執行期第三方依賴，不變更公開 API，也不要求遷移現有本機 workspace 資料。
