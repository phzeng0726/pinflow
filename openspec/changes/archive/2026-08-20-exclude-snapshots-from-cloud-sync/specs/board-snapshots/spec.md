## MODIFIED Requirements

### Requirement: Snapshot storage in workspace
快照 SHALL 儲存於 `boards/board-N/.snapshots/` 目錄下，格式為純 JSON 檔與原始圖片。快照 SHALL 隨 workspace 一起進行 Git 同步，但 SHALL NOT 上傳至 Supabase cloud sync；Supabase 拉取亦 SHALL NOT 寫入 snapshot 內容，且成功覆蓋本機 workspace 後 SHALL 清除既有本機 snapshots。

#### Scenario: Snapshot directory structure
- **WHEN** 任何快照被建立
- **THEN** 快照存放於 `boards/board-N/.snapshots/snap-{id}/`，包含 `meta.json`、`board.json`、`columns.json`、`cards/`、`images/`、`tags.json`、`dependencies.json`
- **THEN** `boards/board-N/.snapshots/index.json` 更新，包含所有快照的 metadata summary

#### Scenario: Supabase sync runs
- **WHEN** 增量、手動或週期性 Supabase 同步執行
- **THEN** `.snapshots` 目錄中的 JSON 與圖片不會上傳至 Supabase

#### Scenario: Cloud data replaces local workspace
- **WHEN** Supabase cloud-to-local replacement 成功完成
- **THEN** 本機 workspace 中所有 `.snapshots` 目錄均被清除
