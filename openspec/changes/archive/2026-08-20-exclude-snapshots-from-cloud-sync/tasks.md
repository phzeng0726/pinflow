## 1. Supabase 同步路徑過濾

- [x] 1.1 在 sync layer 建立正規化的 `.snapshots` 路徑分類器，並套用至增量 upsert／delete push。
- [x] 1.2 修改手動與週期性完整同步掃描，在遇到 `.snapshots` 目錄時略過整個子樹。
- [x] 1.3 修改「以本機取代雲端」的檔案集合，只上傳非 snapshot 的 workspace JSON。
- [x] 1.4 修改來源判斷與 `GetLatestUpdatedAt` 查詢，讓既有雲端 snapshot rows 不計入 cloud data 或同步時間。

## 2. 已完成但被簡化決策取代的保存策略

- [x] 2.1 在本機替換前過濾雲端 snapshot rows，驗證 root manifest，並比較本機與雲端 `workspaceId`。
- [x] 2.2 相同 workspace 拉取時保留本機 snapshot JSON／assets，並以 incoming counter、本機 counter 與現存最大 snapshot ID 計算安全的 next ID。
- [x] 2.3 不同 workspace 拉取成功後清除舊 `.snapshots` 目錄，並確保 fetch、驗證或 JSON 替換失敗時不動到本機 snapshots。

## 3. 簡化 cloud-to-local replacement

- [x] 3.1 移除 workspaceId 分支、snapshot 保存與 counter 協調，改為任何 cloud-to-local replacement 成功後一律清除 `.snapshots` 目錄，失敗時維持不變。

## 4. 測試與驗證

- [x] 4.1 新增 sync manager 測試，覆蓋增量、完整同步、本機取代雲端及舊雲端 snapshot rows 的排除行為。
- [x] 4.2 新增 cloud client 測試，驗證最新更新時間查詢排除 `.snapshots` 路徑。
- [x] 4.3 新增 workspace replacement 測試，覆蓋成功 cloud pull 清除 snapshot JSON／assets，以及 fetch、decode 或 JSON replacement 失敗時保留 snapshots。
- [x] 4.4 執行 Go 格式化與 `go test ./... -v`，確認同步、store 與 snapshot 行為沒有回歸。
