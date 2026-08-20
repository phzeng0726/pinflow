## Context

Supabase sync 目前以「workspace 下所有 JSON」作為同步集合。完整同步與本機取代雲端會因此納入 `boards/board-N/.snapshots/`；雲端拉取與來源判斷也會把既有 snapshot rows 當成正式 workspace 資料。Snapshots 實際上是裝置本機復原歷史，仍需保留在 workspace 供本機操作與 Git 同步，但不應影響 Supabase 狀態。

## Goals / Non-Goals

**Goals:**

- 在所有 Supabase 同步入口一致排除 `.snapshots` 路徑。
- 任何雲端資料覆蓋本機 workspace 後都清除本機 snapshots。
- 讓既有雲端 snapshot rows 不影響來源判斷、時間比較或拉取結果。
- 維持目前 workspace 替換失敗時不破壞本機資料的保護。

**Non-Goals:**

- 不清理或遷移已存在 Supabase 的 snapshot rows。
- 不變更 snapshot 的本機格式、保留政策或 Git 同步方式。
- 不新增前端設定、HTTP API、Supabase schema 或 migration。

## Decisions

1. **以共用路徑分類器定義 Supabase 同步集合。** 正規化路徑分隔符後，只要相對路徑包含名為 `.snapshots` 的完整目錄 segment，即視為 snapshot 路徑。增量 push／delete、完整掃描、本機取代雲端與雲端 pull 都使用同一規則；完整掃描遇到該目錄時直接略過子樹。相較在 snapshot repository 阻止通知，於同步邊界過濾可涵蓋目前沒有通知的完整掃描，也能防止未來新增寫入方式造成漏網。

2. **舊雲端 rows 採讀取忽略，不做清理。** `ListFiles` 的結果在進入來源判斷或本機替換前過濾，最新時間 PostgREST 查詢也排除 snapshot 路徑。既有 rows 保留原狀；只有使用者執行既有的「以本機取代雲端」delete-all 流程時可能被順帶移除。這避免為尚未正式上線的資料增加一次性 migration 與清理狀態。

3. **cloud-to-local replacement 一律清除本機 snapshots。** 同步管理器完整取得雲端檔案並排除 snapshot rows 後，使用既有 `FileStore.ReplaceJSONFiles` 替換 syncable JSON。只有 JSON replacement 成功後，才移除 workspace 內所有 `.snapshots` 目錄；雲端取得、JSON decode 或 replacement 失敗時不清除本機 snapshots。相較依 `workspaceId` 決定保存策略，單一規則不需要 snapshot 合併、ID counter 協調或跨 workspace 相容判斷。

4. **不改變通用 workspace JSON API 的外部契約。** `FileStore.ReadJSONFiles` 與 `ReplaceJSONFiles` 保持通用，Supabase 特有的路徑過濾與 replacement 後清理由同步管理器負責。清理失敗時同步狀態回報錯誤；snapshot JSON 已由成功的 workspace replacement 移除，因此殘留 assets 不會成為可見快照，後續 cloud pull 可再次清理。

## Risks / Trade-offs

- [PostgREST 路徑排除條件與本機分類器不一致] → 以 client 測試固定 query semantics，並以相同 `/.snapshots/` segment 定義測試案例。
- [cloud pull 會失去本機復原歷史] → 將 snapshots 明確定位為本機暫存歷史；任何 workspace replacement 都採相同行為，避免使用者誤以為它是雲端備份。
- [snapshot 目錄清理失敗] → 僅在雲端資料完整取得且 JSON replacement 成功後清理並回報錯誤；後續 cloud pull 會再次嘗試清理。
- [既有 snapshot rows 持續占用 Supabase 空間] → 接受此限制；功能尚未正式上線，不引入專用歷史清理機制。
