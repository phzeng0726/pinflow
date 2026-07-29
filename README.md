# PinFlow

任務不只是管理，還要時刻可見。PinFlow 是一套桌面 Kanban 應用，核心特色是「釘選（Pin）」——把任何卡片懸浮顯示在螢幕最上層，讓進行中的任務始終在視野內，不需切換視窗。

搭配卡片依賴關係圖、甘特式時間軸、封存管理、Supabase 雲端同步、多語系介面與 Git 可同步的檔案式儲存，PinFlow 為個人與小團隊打造流暢的桌面工作流程。

## 功能

- **看板管理**：建立多個 Board，每個 Board 包含多個欄位（Column）
- **卡片管理**：新增卡片、拖曳排序、跨欄移動、複製卡片
- **釘選模式**：手動釘選或設定「自動釘選」欄位，卡片懸浮顯示在桌面最上層
- **卡片詳情**：富文字編輯（Lexical）、截止日期、留言、附件圖片
- **Checklist**：支援多清單、拖曳排序與跨清單移動
- **依賴關係圖**：視覺化呈現卡片間的前置/後置依賴（@xyflow/react + dagre）
- **標籤管理**：每個 Board 可獨立管理 Tag，並可附加至多張卡片
- **卡片搜尋**：跨欄位搜尋卡片
- **檔案式儲存**：資料以 JSON 儲存，可透過 Git 同步到不同裝置
- **時間軸視圖**：以甘特圖風格瀏覽卡片截止日期，支援欄位與標籤篩選
- **快照管理**：建立 / 還原看板快照，輕鬆復原誤操作
- **看板排序**：支援拖曳重新排列看板列表的顯示順序
- **多語系介面**：支援繁體中文與 English，可即時切換
- **範例資料**：首次啟動時自動填入 Example Board，包含四個欄位（Todo、In Progress、Done、Important），其中 **Important 欄位預設啟用「自動釘選」**，新增或移入的卡片會自動釘選至懸浮視窗；Seed 資料涵蓋卡片、標籤、Checklist、留言、依賴與時程，讓使用者立即體驗完整功能
- **封存管理**：封存卡片或欄位，減少看板雜亂，需要時可隨時還原
- **雲端同步**：透過 Supabase 將工作區資料同步至雲端，支援多裝置存取
- **桌面版自動更新**：啟動時自動檢查並下載新版本，重啟後完成安裝（electron-updater）
- **Swagger UI**：內建 API 文件

## 技術棧

| 層級     | 技術                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Backend  | Go 1.25 · Gin · 檔案式 JSON 儲存 · Supabase cloud sync · Swagger                                                                  |
| Frontend | React 19 · TypeScript · Vite · Tailwind v3 · TanStack Query/Router · Zustand · @dnd-kit · Lexical · @xyflow/react · shadcn/ui · i18next |
| Desktop  | Electron 36 (Windows)                                                                                                             |
| 部署     | Docker Compose                                                                                                                    |

---

## 資料儲存

Pinflow 採用 **Bruno 風格的檔案式儲存**（無資料庫），所有資料以 JSON 檔案存放在 workspace 目錄中：

```
pinflow-workspace/
  manifest.json          # 版本 + 全域 ID 計數器
  settings.json          # 使用者設定（主題、語言）
  boards/
    board-N/
      board.json         # Board 元資料
      manifest.json      # per-board ID 計數器（tag、dependency）
      columns.json       # 該 Board 的所有欄位
      tags.json          # 該 Board 的標籤
      dependencies.json  # 該 Board 的卡片依賴關係
      cards/
        card-N.json      # 卡片（含 tag_ids + 內嵌 checklists、comments）
```

**優點：**

- 資料可攜（portable）— 複製目錄即可搬移
- 可透過 Git 同步到不同裝置
- 無需安裝資料庫
- 每張卡片獨立一個檔案，Git merge 衝突最小化

---

## 快速開始

### 前置需求

- Go 1.25+
- Node.js 20+
- pnpm（`npm install -g pnpm`）

安裝根目錄與前端依賴：

```bash
pnpm install
cd frontend && pnpm install && cd ..
```

啟動完整桌面開發環境：

```bash
make dev
```

也可分別執行 `make backend`、`make frontend` 與 `make electron`。Electron 會載入 `http://localhost:5173`，Vite 則將 `/api` 代理至 `http://localhost:34115`。

純 Web 模式只需啟動前後端：

```bash
make backend
make frontend
```

Swagger UI：`http://localhost:34115/swagger/index.html`

## 雲端同步設定

雲端同步目前由 Electron 桌面版提供登入入口。請先建立 Supabase project、啟用 Google Provider，並將以下網址加入 Authentication Redirect URLs：

```text
http://127.0.0.1:34116/auth/callback
```

在專案根目錄設定：

| 變數 | 說明 |
| --- | --- |
| `PINFLOW_SUPABASE_URL` | Supabase project URL |
| `PINFLOW_SUPABASE_ANON_KEY` | Supabase anon 或 publishable key |

```text
PINFLOW_SUPABASE_URL=https://<project-ref>.supabase.co
PINFLOW_SUPABASE_ANON_KEY=<publishable-key>
```

`Makefile` 會載入根目錄的 `.env`。`make package` 會將設定嵌入 Go backend，執行期間提供的環境變數仍具有最高優先權。

登入後若雲端已有資料，PinFlow 會要求選擇工作區來源：

- **使用雲端資料**：以雲端工作區取代本機 JSON。
- **使用本機資料**：清除該帳號的雲端工作區，再上傳本機 JSON。
- **稍後決定**：暫停同步，直到完成來源選擇。

選定來源後，可透過工具列的同步狀態按鈕啟用、停用或立即同步。

### Supabase Migration

Schema 與 RLS policy 位於：

```text
supabase/migrations/20260729000000_create_workspace_files.sql
```

Backend 只透過 PostgREST 存取資料，不會自行執行 migration。部署前請使用 Supabase CLI 套用：

```bash
supabase link --project-ref <project-ref>
supabase db push --dry-run
supabase db push
```

若既有 project 已有完全等效的 schema，可在確認資料表、foreign key 與 RLS policy 後執行：

```bash
supabase migration repair --status applied 20260729000000
```

## 常用指令

| 指令 | 說明 |
| --- | --- |
| `make dev` | 同時啟動 Backend、Frontend 與 Electron |
| `make backend` | 啟動 Go API，預設 port `34115` |
| `make frontend` | 啟動 Vite，預設 port `5173` |
| `make package` | 建置 Windows NSIS 安裝檔至 `dist-electron/` |
| `make test-backend` | 執行完整 Backend 測試 |
| `make test-migration` | 以 PostgreSQL 17 驗證 Supabase migration |
| `make test-all` | 執行 Backend 與 migration 測試 |
| `cd frontend && pnpm test` | 執行 Frontend 測試 |
| `cd frontend && pnpm lint` | 執行 ESLint |
| `cd frontend && pnpm format:check` | 檢查 Prettier 格式 |

`go test ./...` 是完整 Backend 測試的標準入口，請勿以 `go test ./tests/...` 取代。

Migration 測試資料庫可透過 `make test-db-up`、`make test-db-status`、`make test-db-logs` 與 `make test-db-down` 管理。

## 打包與部署

### Electron

```bash
make package
# 或
scripts/build.bat
```

安裝版工作區位於：

```text
C:/Users/<使用者>/AppData/Roaming/PinFlow/workspace/
```

關閉主視窗後程式會縮小至 System Tray；備份時只需複製整個 workspace 目錄。

### Docker Web 模式

```bash
docker-compose up --build
docker-compose down
```

前端位於 `http://localhost`，API 位於 `http://localhost:34115/api/v1`。

### GitHub Release

推送 `v*` 格式的 tag 會觸發 `.github/workflows/release.yml`，建立 Windows NSIS 安裝檔與 auto-update metadata：

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 專案結構

```text
backend/          # Go API、服務、檔案儲存與 Supabase sync
frontend/         # React SPA、Query hooks、Zustand stores 與 UI
electron/         # 桌面視窗、IPC、OAuth 與 Backend process
openspec/         # Spec-driven 開發規格與變更記錄
supabase/         # Schema、RLS migration 與驗證 SQL
scripts/          # 建置及 migration 測試腳本
```

Backend 依序分為 `api/`、`service/`、`repository/`、`store/` 與 `model/`；Frontend 主要程式位於 `frontend/src/`，依 `pages/`、`components/`、`hooks/`、`stores/` 與 `lib/` 分層。

## API

API base URL 為 `http://localhost:34115/api/v1`，主要資源包括：

- `auth`、`sync`、`settings`
- `boards`、`columns`、`cards`、`tags`
- `checklists`、`comments`、`dependencies`
- `images`、`snapshots`、`archive`

完整端點與 request/response schema 請見 Swagger UI：`http://localhost:34115/swagger/index.html`
