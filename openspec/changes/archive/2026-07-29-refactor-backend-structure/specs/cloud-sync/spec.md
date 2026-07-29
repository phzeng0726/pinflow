## ADDED Requirements

### Requirement: 版本化 Supabase schema migration
Cloud sync 所需的 Supabase schema 必須（MUST）以具版本編號的 SQL migration 保存於 `supabase/migrations/`。Migration 必須（SHALL）定義 `public.workspace_files`、其 `(user_id, path)` primary key、對 `auth.users(id)` 的 cascade reference、JSONB 內容、更新時間、row-level security，以及將所有資料列操作限制於已認證使用者自身 `user_id` 的 policy。

此 migration 必須（SHALL）能安全套用於新的 Supabase project，以及曾透過 `backend/sync/schema.sql` 手動建置的既有 project。後端應用程式不得（SHALL NOT）在執行期執行 migration，也不得要求資料庫 schema 管理權限。

#### Scenario: 建置新的 Supabase project
- **WHEN** 對新的 Supabase project 套用文件記載的 migration 流程
- **THEN** 系統建立 `workspace_files` 與隔離使用者資料的 RLS policy，且 schema 符合 cloud sync REST client 的需求

#### Scenario: 既有 project 納入 migration 追蹤
- **WHEN** 對已手動建立等效資料表與 policy 的 project 套用 migration
- **THEN** migration 納管流程完成，且不會刪除或變更既有 workspace 資料列

#### Scenario: 桌面應用程式啟動
- **WHEN** PinFlow 連線至已設定的 Supabase project 並啟動
- **THEN** 應用程式透過 PostgREST 使用既有 schema，不會嘗試建立、變更或 migration 資料庫物件

## MODIFIED Requirements

### Requirement: Write notification channel
每個 `FileStore` instance 必須（SHALL）將成功寫入檔案的路徑，以該 instance 的 workspace root 為基準轉為相對路徑後，傳送至其設定的通知 channel。通知設定必須（MUST）歸屬於 `FileStore` instance，且不得（MUST NOT）儲存在 package-level 可變狀態。傳送必須（SHALL）採非阻塞方式，以免阻塞主應用程式。

#### Scenario: File write triggers notification
- **WHEN** `FileStore` 的公開操作成功保存 JSON 檔案
- **THEN** 該檔案的 workspace 相對路徑會傳送至該 Store instance 的通知 channel

#### Scenario: No notifier registered
- **WHEN** `FileStore` 保存檔案，且該 instance 未設定 notifier channel
- **THEN** 寫入正常完成，且不會嘗試傳送通知

#### Scenario: Channel buffer full
- **WHEN** `FileStore` 的通知 channel 已滿
- **THEN** 通知會被捨棄，但寫入仍會成功完成

#### Scenario: 多個 Store 使用不同 notifier
- **WHEN** 兩個 `FileStore` instance 使用不同通知 channel 保存檔案
- **THEN** 每個 channel 只會收到其所屬 Store instance 產生的通知
