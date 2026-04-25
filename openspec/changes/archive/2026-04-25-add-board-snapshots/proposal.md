## Why

使用者在執行刪除 column、刪除 card 等破壞性操作後，目前沒有任何還原機制，資料一旦消失即不可復原。加入 board-level 快照功能可讓使用者在誤操作後快速回到先前狀態。

## What Changes

- 新增 **自動快照**：在刪除 column / card 等破壞性動作前自動建立快照；在新增或更新 card / column 等動作後以 debounce 方式建立快照（同 board 10 分鐘內已有快照則 skip）
- 新增 **手動快照**：使用者可從 board detail 頁手動建立還原點並命名
- 新增 **版本清單 UI**：在 board detail header 提供「版本」按鈕，開啟快照清單 dialog，顯示所有快照並支援還原與刪除
- 新增 **還原機制**：還原整個 board 到指定快照狀態；還原前自動建立「還原前快照」作為安全網
- 新增 **保留策略**：自動快照保留最近 7 天；手動快照永久保留
- 新增 **Gin middleware** 統一攔截 mutation 路由，不修改既有 service / handler 邏輯
- 快照存放於 workspace 內的 `boards/board-N/.snapshots/`，隨 workspace 一起 Git 同步

## Capabilities

### New Capabilities

- `board-snapshots`: Board 快照的完整生命週期 — 自動觸發（middleware）、手動建立、快照清單、還原、刪除、7 天自動清理，以及對應的前端 UI

### Modified Capabilities

（無：現有 spec 的需求規格不受影響）

## Impact

- **Backend**
  - `backend/store/store.go`：新增 `ReloadBoard`、`BoardDir`、`BoardIDOf*` 反查 helper
  - `backend/model/`、`backend/repository/`、`backend/service/`、`backend/dto/`：新增 snapshot 相關檔案
  - `backend/api/`：新增 snapshot handler + Gin middleware
  - `backend/api/router.go`：新增 snapshot 路由、掛載 middleware
  - `backend/main.go`：`NewRouter` 多傳一個 `*store.FileStore` 參數
- **Frontend**
  - `frontend/src/types/index.ts`：新增 `BoardSnapshot` interface
  - `frontend/src/lib/api/snapshots.ts` + `index.ts`：新增 axios 呼叫
  - `frontend/src/hooks/snapshot/`：新增 query / mutation hooks
  - `frontend/src/hooks/queryKeys.ts`：擴充 `snapshots` key
  - `frontend/src/pages/board-detail/`：新增 snapshot dialog 元件、header 按鈕
- **Workspace 結構**：`boards/board-N/.snapshots/` 目錄新增（含 `index.json` + `snap-{id}/` 子目錄）
