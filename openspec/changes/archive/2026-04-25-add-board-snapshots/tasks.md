## 1. Backend — FileStore 基礎建設

- [x] 1.1 `backend/store/store.go`：新增 `BoardDir(boardID uint) string`，回傳 `boards/board-N/` 的絕對路徑
- [x] 1.2 `backend/store/store.go`：新增 `BoardIDOfCard(cardID uint) (uint, bool)`，從 in-memory cards map O(1) 反查 boardID
- [x] 1.3 `backend/store/store.go`：新增 `BoardIDOfColumn(columnID uint) (uint, bool)`
- [x] 1.4 `backend/store/store.go`：新增 `BoardIDOfChecklist(checklistID uint) (uint, bool)`
- [x] 1.5 `backend/store/store.go`：新增 `BoardIDOfComment(commentID uint) (uint, bool)`
- [x] 1.6 `backend/store/store.go`：新增 `BoardIDOfDependency(dependencyID uint) (uint, bool)`
- [x] 1.6a `backend/store/store.go`：新增 `BoardIDOfChecklistItem(itemID uint) (uint, bool)`（middleware checklist-item 路由反查 boardID 所需）
- [x] 1.7 `backend/store/store.go`：新增 `ReloadBoard(boardID uint) error`，清除 in-memory 中該 board 的 columns/cards 後從 `board-N/` 目錄重讀

## 2. Backend — Snapshot 資料層

- [x] 2.1 `backend/model/snapshot.go`：定義 `Snapshot` struct（ID, BoardID, Name, IsManual, Trigger, CreatedAt）與 `SnapshotIndex`（快照清單 metadata）
- [x] 2.2 `backend/dto/snapshot.go`：定義 `CreateSnapshotRequest`、`SnapshotResponse`
- [x] 2.3 `backend/repository/snapshot_repository.go`：實作 `SnapshotRepository` interface — `List`、`Save`（寫入 meta.json + index.json）、`Load`（讀取快照目錄）、`Delete`（刪目錄 + 更新 index.json）

## 3. Backend — Snapshot Service

- [x] 3.1 `backend/service/snapshot_service.go`：實作 `CreateSnapshot(boardID, name, isManual, trigger)`
  - 複製 `board.json`、`columns.json`、`cards/`、`images/` 到 `.snapshots/snap-{id}/`
  - 擷取 board 相關 tags subset、dependencies subset 並寫入快照目錄
  - 更新 `index.json`
- [x] 3.2 同上：實作 debounce 邏輯 — 讀取 `index.json` 比對最近自動快照時間，10 分鐘內則 skip
- [x] 3.3 同上：實作 `RestoreSnapshot(boardID, snapshotID)`
  - 建立 `restore-before-{timestamp}` 安全網快照
  - 覆寫 `board-N/` 目錄（board.json、columns.json、cards/、images/）
  - 合併 tags（以 id 比對，不存在則重建）
  - 更新 global dependencies（清除舊的 + 寫入 snapshot 版本）
  - 更新 `manifest.json` NextIDs
  - 呼叫 `FileStore.ReloadBoard(boardID)`
- [x] 3.4 同上：實作 `ListSnapshots(boardID)`（讀 index.json，倒序排列）
- [x] 3.5 同上：實作 `DeleteSnapshot(boardID, snapshotID)`
- [x] 3.6 同上：實作 7 天自動清理（每次建立自動快照時觸發，刪除 `isManual=false && createdAt < now-7d`）
- [x] 3.7 `backend/service/service.go`：`Services` struct 新增 `Snapshot SnapshotService`，`NewServices` 注入

## 4. Backend — Middleware

- [x] 4.1 `backend/api/middleware/snapshot.go`：定義 `mutationRule` struct（Trigger, Mode, BoardIDFrom）
- [x] 4.2 同上：建立 route metadata table，涵蓋所有 create/update/delete 路由
- [x] 4.3 同上：實作 `Snapshot(svc, fs)` gin.HandlerFunc — sync 模式在 `c.Next()` 前執行，debounce 模式在 `c.Next()` 後且 2xx 時以 goroutine 非同步執行

## 5. Backend — Handler 與 Router

- [x] 5.1 `backend/api/snapshot_handler.go`：實作 `SnapshotHandler` 與 `ListSnapshots`、`CreateSnapshot`、`RestoreSnapshot`、`DeleteSnapshot` handler（含 Swagger godoc）
- [x] 5.2 `backend/api/handler.go`：`Handlers` struct 新增 `Snapshot *SnapshotHandler`，`NewHandlers` 注入
- [x] 5.3 `backend/api/router.go`：`NewRouter` 新增 `*store.FileStore` 參數；在 `v1` group 掛載 middleware；在 `boards` group 新增 4 條 snapshot 路由
- [x] 5.4 `backend/main.go`：更新 `NewRouter` 呼叫，傳入 `fs`
- [x] 5.5 `cd backend && swag init` 重新產生 Swagger 文件

## 6. Backend — 測試

- [x] 6.1 `backend/tests/service/snapshot_service_test.go`：測試 create（手動 / 自動）、debounce skip、restore、7 天清理
- [x] 6.2 `backend/tests/middleware/snapshot_middleware_test.go`：測試各 mutation route 觸發正確、失敗請求不觸發、boardID 反查正確
- [x] 6.3 `backend/tests/handler/snapshot_handler_test.go`：HTTP 層 list / create / restore / delete 測試

## 7. Frontend — 型別與 API

- [x] 7.1 `frontend/src/types/index.ts`：新增 `BoardSnapshot` interface（id, boardId, name, isManual, trigger, createdAt）
- [x] 7.2 `frontend/src/lib/api/snapshots.ts`：實作 `listSnapshots`、`createSnapshot`、`restoreSnapshot`、`deleteSnapshot` axios 呼叫
- [x] 7.3 `frontend/src/lib/api/index.ts`：re-export `./snapshots`
- [x] 7.4 `frontend/src/hooks/queryKeys.ts`：新增 `snapshots: { byBoard: (boardId) => ['snapshots', 'board', boardId] as const }`

## 8. Frontend — Hooks

- [x] 8.1 `frontend/src/hooks/snapshot/queries/useSnapshots.ts`：實作 `useSnapshots(boardId)` query hook
- [x] 8.2 `frontend/src/hooks/snapshot/mutations/useSnapshotMutations.ts`：實作 `useSnapshotMutations()`（createSnapshot、restoreSnapshot、deleteSnapshot）含 toast 回饋與 invalidate

## 9. Frontend — UI 元件

- [x] 9.1 `frontend/src/pages/board-detail/components/snapshots/SnapshotDialog.tsx`：版本清單主 Dialog，分「手動快照」與「自動快照」兩個分區顯示
- [x] 9.2 `frontend/src/pages/board-detail/components/snapshots/SnapshotList.tsx`：快照清單 item（顯示 isManual 標記、trigger label、相對時間、還原/刪除按鈕）
- [x] 9.3 `frontend/src/pages/board-detail/components/snapshots/CreateSnapshotDialog.tsx`：手動建立快照 Dialog（輸入名稱，可為空）
- [x] 9.4 `frontend/src/pages/board-detail/components/snapshots/RestoreConfirmDialog.tsx`：還原確認 AlertDialog（提示「將自動建立還原前快照」）
- [x] 9.5 `frontend/src/pages/board-detail/BoardPage.tsx`：在 Header `ml-auto` 區塊新增「版本」按鈕（Clock icon），點擊開啟 SnapshotDialog
- [x] 9.6 手動執行 UI 流程：建立快照 → 列出快照 → 還原 → 確認資料還原正確（待手動測試）
