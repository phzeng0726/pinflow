## Context

PinFlow 後端目前混用兩種測試佈局：多數跨層測試位於 `backend/tests/`，但 cloud sync 近期新增的測試分散在 `api/`、`seed/`、`store/` 與 `sync/` package。其中部分測試使用相同 package 存取 `writeJSON`、內嵌 Supabase 預設值、`Manager` 私有欄位及自訂 HTTP transport，使其無法直接移到獨立的 `tests` package。

`store/io.go` 以 package-level 變數保存唯一 notifier 及 workspace base path。這表示同一 process 內的不同 `FileStore` 會互相覆蓋狀態，也使測試必須手動清理全域設定。另一方面，`sync.Manager` 在建構時自行建立 REST client，且 reconciliation、retry 與 debounce 時間固定在實作中，導致測試需要觸碰私有欄位或等待真實時間。

Supabase 的 `workspace_files` 表與 RLS policy 目前只存在於 `backend/sync/schema.sql`。應用程式不會讀取此檔案，且檔名無法表達 migration 順序；它實際上是部署基礎設施，而不是 Go `sync` package 的執行期資產。

## Goals / Non-Goals

**Goals:**

- 將所有 Go 測試檔集中至 `backend/tests/` 及其子目錄，並以外部 package 的公開行為進行驗證。
- 提供可重用且彼此隔離的 workspace、router、store 與 Supabase mock 測試工具。
- 將 Store notifier 改為 instance-owned，允許多個 `FileStore` 安全共存。
- 為 cloud sync 建立足夠的依賴注入邊界，使 HTTP、排程及重試行為不需透過私有欄位測試。
- 將 `store.go` 依領域拆檔，但保持相同 `store` package、公開方法與資料格式。
- 將 Supabase schema 納入版本化 migration 並記錄套用流程。
- 維持 `go test ./...` 在重構前後皆通過。

**Non-Goals:**

- 不改變 HTTP routes、request/response DTO 或前端呼叫方式。
- 不改變 workspace JSON 結構、ID 配置規則或現有資料。
- 不更換 Supabase、不導入新的 migration runtime library，也不讓桌面應用程式自行執行遠端 migration。
- 不重新設計 cloud sync 衝突解決、重試策略或同步週期。
- 不將 `sync` package 重新命名，也不進行與本次可測試性無關的廣泛 API 重寫。

## Decisions

### 1. 測試以領域子目錄集中，並採外部 package

測試將整理為：

```text
backend/tests/
  api/
  repository/
  seed/
  service/
  store/
  sync/
  testutil/
```

各測試目錄使用獨立的外部 package，例如 `package store_test`、`package sync_test`，並只透過 production package 的公開契約測試。`testutil/` 提供一般 Go package，集中建立暫存 workspace、完整 router、認證狀態與可設定回應的 `httptest.Server`。

選擇領域子目錄而不是將全部檔案平鋪在 `backend/tests/`，是為了避免單一測試 package 持續膨脹、測試 helper 命名衝突及不相關領域互相耦合。相較保留 co-located white-box tests，此方案符合專案要求的集中式測試佈局，代價是必須先建立合理的公開注入邊界。

### 2. 測試公開行為，不新增 test-only export

不使用 `export_test.go`、build tags 或僅供測試呼叫的公開 setter 暴露內部欄位。原本依賴私有狀態的案例改從可觀察結果驗證：

- Store write notification 透過公開 Store 操作觸發。
- Supabase 設定透過明確的 config resolver 輸入與輸出驗證。
- Sync HTTP 行為透過注入的 client/transport 或 `httptest.Server` 驗證。
- Manager 排程與 retry 透過建構依賴控制，不直接修改私有 duration 或 function 欄位。

此方式會增加少量 production-facing 組態型別，但這些型別同時改善實際組裝彈性，而不是純測試後門。

### 3. Notifier 歸屬於 FileStore instance

`FileStore` 將持有自己的 notifier channel。`SetWriteNotifier` 保留為 instance method，以降低 `main.go` 與現有呼叫端的變更量；package-level `SetWriteNotifier`、全域 notifier struct 與 base path 狀態移除。

Persistence write 將經由 `FileStore` receiver 發送 workspace-relative path，delete notification 也使用同一 instance channel。無 notifier 或 channel 已滿時仍採 non-blocking 行為。

相較建立獨立 event bus，此方案貼近目前單一用途且改動較小；若未來需要多訂閱者，再於另一 change 中抽象化。

### 4. Sync 使用明確依賴結構，同時保留簡單預設建構

Cloud sync 將定義 Manager 所需的最小 client interface，涵蓋 list、batch upsert、單檔/全量刪除等既有操作。預設 `NewManager` 仍組裝 production REST client 與目前的 500ms debounce、3 分鐘 reconciliation、5 秒 retry 設定。

另提供以依賴結構建構 Manager 的入口，允許傳入：

- cloud client
- debounce、reconciliation 與 retry durations
- 必要的背景工作觸發替身

HTTP client 本身也透過建構參數注入，不再由測試修改 `Client.http` 私有欄位。設定解析改為一個接收 embedded defaults 與 environment lookup 的明確 resolver；現有 `SupabaseURL()`、`SupabaseAnonKey()` 與 ldflags 行為仍由預設 resolver 對外維持。

選擇建構注入而非 package-level 可變 hooks，可避免平行測試競爭並讓依賴關係集中在 composition root。

### 5. Store 僅拆檔，不拆 package

`backend/store/store.go` 依現有責任拆成 workspace、board、column、card、tag、checklist、comment、dependency、snapshot、settings、index 與 persistence 等檔案。所有檔案仍屬 `package store`，`FileStore` 型別、lock 策略與公開方法簽章保持不變。

這是純結構拆分，不同時建立新的 repository abstraction，以避免把低風險整理擴張成儲存層重寫。拆檔採小批次進行，每批完成後立即執行完整 Go 測試。

### 6. Supabase schema 使用標準 migration 目錄

原始 SQL 移至 `supabase/migrations/<timestamp>_create_workspace_files.sql`。Migration 保留：

- `public.workspace_files`
- `(user_id, path)` primary key
- `auth.users(id)` cascade foreign key
- JSONB content 與 timestamp
- RLS 與「使用者只能管理自己的資料」policy

README 說明新環境如何透過 Supabase migration 工具套用，以及既有已手動建表環境不需由應用程式重複執行。應用程式仍只透過 PostgREST 使用資料表，不取得 schema migration 權限。

選擇保留並移動 SQL，而不是刪除，是因為刪除會讓新環境無法從版本庫重建必要的安全政策。

## Risks / Trade-offs

- [集中測試後無法直接驗證私有函式] → 改驗證公開可觀察行為，只有具 production 意義的依賴才加入建構介面。
- [Store 大量機械搬移可能產生遺漏或重複宣告] → 按領域分批搬移，每批執行 `gofmt`、`go test ./...`，最後用符號搜尋確認原檔無殘留。
- [Notifier instance 化需要調整所有 persistence call sites] → 先建立 receiver-based write helper，再逐一替換並以 write/delete notification regression tests 保護。
- [過度彈性的 Sync options 會擴大 API 面積] → 依賴結構只包含現有測試與 production 組裝確實需要的項目，production 保留具有安全預設值的簡單 constructor。
- [Migration 在既有 Supabase 專案重複執行可能遇到 policy 已存在] → migration 使用可重複套用或明確處理既有物件的 SQL，並在文件列出既有環境驗證步驟。
- [移動測試可能造成 coverage 歸屬或 package 名稱改變] → 以 `go test ./...` 作為唯一驗收入口，必要時另輸出 coverprofile，不依賴舊 package 測試名稱。

## Migration Plan

1. 建立集中式測試目錄與 `testutil`，先搬移不依賴私有狀態的 API、seed 與 Store 公開行為測試。
2. 將 Store notifier 改為 instance-owned，改寫 notification 測試後搬入 `backend/tests/store/`。
3. 建立 Sync config/client/manager 的依賴注入邊界，搬移所有 sync 與 auth/sync handler 測試。
4. 確認 `backend/` 業務 package 下不再存在 `*_test.go`，並執行 `go test ./...`。
5. 依領域分批拆分 `store.go`，每批保持測試通過。
6. 新增 Supabase migration、刪除 `backend/sync/schema.sql`，並更新 README 的初始化與測試命令。
7. 執行格式化、完整測試與 OpenSpec 驗證。

若程式碼重構需要回退，可逐批還原檔案移動與 constructor 變更；workspace 與遠端資料格式未改變，因此不需要資料 rollback。Supabase migration 只建立或確認既有物件，不在 rollback 中刪除使用者資料。

## Open Questions

- 無。測試集中位置、migration 歸屬與不改變外部行為的範圍已由本 change 確定。
