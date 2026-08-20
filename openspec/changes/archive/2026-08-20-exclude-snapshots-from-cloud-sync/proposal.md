## Why

Board snapshots 是裝置本機的復原歷史，不需要成為 Supabase workspace 備份的一部分。目前完整同步會遞迴收集所有 JSON，導致 `.snapshots/` 內容被上傳，增加不必要的雲端資料量，並可能在拉取時覆蓋或錯置本機快照。

## What Changes

- 所有 Supabase 上傳路徑排除 `boards/board-N/.snapshots/` 下的檔案。
- Supabase 的資料存在判斷、更新時間比較與拉取流程忽略既有 snapshot rows，但不新增清理或 migration。
- 任何 Supabase cloud-to-local replacement 成功後都清除本機 snapshots，讓 workspace replacement 維持單一且可預期的行為。
- Snapshots 仍保留在 workspace 中，維持既有本機操作與 Git 同步能力。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `cloud-sync`: 將 snapshot 路徑排除於 Supabase push、pull、來源判斷及同步時間比較之外，並定義 cloud-to-local replacement 一律清除本機 snapshots。
- `sync-auto-decision`: 最新雲端更新時間只計算可同步的 workspace rows，排除 snapshot rows。
- `board-snapshots`: 明確定義 snapshots 為 Supabase 同步範圍外的裝置本機資料，同時保留 workspace／Git 同步行為。

## Impact

- 後端同步管理器、Supabase client 查詢與 workspace JSON 替換流程。
- 同步與 store 測試，以及 `cloud-sync`、`board-snapshots` OpenSpec 規格。
- 不變更 HTTP API、前端介面、Supabase schema 或資料庫 migration。
