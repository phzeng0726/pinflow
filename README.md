# Pinflow

Trello 風格的看板任務管理桌面應用，支援卡片依賴關係圖、懸浮釘選視窗與豐富的卡片功能。

## 功能

- **看板管理**：建立多個 Board，每個 Board 包含多個欄位（Column）
- **卡片管理**：新增卡片、拖曳排序、跨欄移動、複製卡片
- **釘選模式**：手動釘選或設定「自動釘選」欄位，卡片懸浮顯示在桌面最上層
- **卡片詳情**：富文字編輯（Lexical）、截止日期、留言、附件圖片
- **Checklist**：支援多清單、拖曳排序與跨清單移動
- **依賴關係圖**：視覺化呈現卡片間的前置/後置依賴（@xyflow/react + dagre）
- **標籤管理**：全域 Tag，可附加至多張卡片並支援 CRUD
- **卡片搜尋**：跨欄位搜尋卡片
- **檔案式儲存**：資料以 JSON 儲存，可透過 Git 同步到不同裝置
- **範例資料**：首次啟動時自動填入 Example Board，包含四個欄位（Todo、In Progress、Done、Important），其中 **Important 欄位預設啟用「自動釘選」**，新增或移入的卡片會自動釘選至懸浮視窗；Seed 資料涵蓋卡片、標籤、Checklist、留言、依賴與時程，讓使用者立即體驗完整功能
- **Swagger UI**：內建 API 文件

## 技術棧

| 層級     | 技術                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Backend  | Go 1.25 · Gin · 檔案式 JSON 儲存 · Swagger                                                                                        |
| Frontend | React 19 · TypeScript · Vite · Tailwind v3 · TanStack Query/Router · Zustand · @dnd-kit · Lexical · @xyflow/react · shadcn/ui |
| Desktop  | Electron 40 (Windows)                                                                                                             |
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

## 桌面版應用（Electron）

### 前置需求

- Go 1.25+
- Node.js 20+
- pnpm（`npm install -g pnpm`）

### 一、安裝依賴

```bash
# 安裝 Electron 相關套件（在專案根目錄執行）
pnpm install

# 安裝 frontend 依賴
cd frontend && pnpm install && cd ..
```

### 二、啟動桌面版（開發模式）

推薦使用 `make` 指令一鍵啟動：

```bash
make dev   # 同時啟動 backend、frontend、electron（-j3 並行）
```

或分別啟動：

```bash
make backend   # cd backend && go run . --workspace ../../pinflow-workspace
make frontend  # cd frontend && pnpm dev
make electron  # pnpm electron:dev
```

> Electron 視窗會載入 `http://localhost:5173`（Vite dev server）。DevTools 會自動開啟。

### 三、打包桌面安裝檔

一鍵完成 Go backend 編譯、前端建置、Electron 打包：

```bash
make package
```

或直接呼叫 PowerShell 腳本：

```bat
scripts\build.bat
```

打包完成後安裝程式會在 `dist-electron/` 目錄下：

| 平台    | 產出檔案                                   |
| ------- | ------------------------------------------ |
| Windows | `PinFlow Setup 0.1.0.exe`（NSIS 安裝程式） |

### 四、安裝與資料儲存

執行 `dist-electron/PinFlow Setup 0.1.0.exe`，依照安裝精靈完成安裝。安裝後從桌面捷徑或開始功能表啟動「PinFlow」。

**資料儲存位置：**

安裝版的 workspace 位於使用者的 AppData 目錄下：

```
C:\Users\<使用者>\AppData\Roaming\PinFlow\workspace\
```

該目錄包含所有看板、卡片、標籤等資料（JSON 格式），結構同上方「資料儲存」段落。

> **提示：**
> - 關閉主視窗後程式會縮小至系統列（System Tray），右鍵點擊托盤圖示可選擇重新開啟或完全關閉。
> - 備份資料只需複製整個 workspace 目錄。

---

## 純網頁開發模式

不需要 Electron，直接在瀏覽器中使用：

### 前置需求

- Go 1.25+
- Node.js 20+
- pnpm（`npm install -g pnpm`）

### 1. 啟動 Backend

```bash
cd backend
go run . --workspace ../../pinflow-workspace
```

API 服務啟動於 `http://localhost:34115`

Swagger UI：`http://localhost:34115/swagger/index.html`

### 2. 啟動 Frontend

```bash
cd frontend
pnpm install   # 第一次需要
pnpm dev
```

開啟瀏覽器：`http://localhost:5173`

> Vite 會自動將 `/api` 請求 proxy 到 `:34115`，無需額外設定。

---

## 執行測試

### Backend 測試

```bash
cd backend
go test ./tests/... -v
```

### Frontend 測試

```bash
cd frontend
pnpm test          # vitest
pnpm lint          # ESLint 檢查
pnpm format        # Prettier 格式化
pnpm format:check  # 確認格式符合規範
```

---

## Docker 部署（Web 模式）

不需要 Electron，直接以容器化方式運行前後端。

### 前置需求

- Docker Desktop

### 啟動

```bash
docker-compose up --build
```

| 服務     | URL                                         |
| -------- | ------------------------------------------- |
| 前端     | `http://localhost`                          |
| 後端 API | `http://localhost:34115/api/v1`             |
| Swagger  | `http://localhost:34115/swagger/index.html` |

### 停止

```bash
docker-compose down
```

---

## 自動化版本發佈（CI/CD）

專案透過 GitHub Actions（`.github/workflows/release.yml`）在推送符合 `v*` 格式的 Git tag 時，自動完成打包並建立 GitHub Release。

### 觸發方式

```bash
# 1. 在本地建立帶版號的 tag
git tag v0.1.0

# 2. 推送 tag 到遠端
git push origin v0.1.0
```

> tag 名稱會自動去除前綴 `v`，並同步寫入根目錄 `package.json` 的 `version` 欄位作為打包版號。

### 自動執行流程

| 步驟 | 說明                                                          |
| ---- | ------------------------------------------------------------- |
| 1    | 在 `windows-latest` runner 上 checkout                        |
| 2    | 從 tag 解析版本號並同步到 `package.json`                      |
| 3    | 安裝 Go 1.25、Node.js 20、pnpm 9                              |
| 4    | 編譯 Go backend → `electron/resources/pinflow-backend.exe`    |
| 5    | 建置 Frontend（`ELECTRON_BUILD=1`）                           |
| 6    | 執行 `electron-builder --win --publish never` 打包 NSIS 安裝檔 |
| 7    | 將 `dist-electron/` 內的 `.exe`、`.exe.blockmap`、`latest.yml` 上傳至 GitHub Release（自動產生 Release Notes） |

### 產出檔案

Release 頁面會附帶下列檔案，可直接提供使用者下載安裝：

- `PinFlow Setup <version>.exe`
- `PinFlow Setup <version>.exe.blockmap`
- `latest.yml`（auto-update 用 metadata）

---

## 專案結構

```
pinflow/
├── backend/          # Go API server
│   ├── api/          # Handlers 容器（handler.go）+ Gin handlers + router.go
│   ├── service/      # Services 容器（service.go）+ 業務邏輯
│   ├── repository/   # Repositories 容器（repository.go）+ 檔案式實作
│   ├── store/        # FileStore（記憶體 + JSON 持久化）
│   ├── model/        # 資料模型
│   ├── dto/          # 請求/回應 DTO
│   ├── seed/         # 首次啟動範例工作區資料（embed）
│   ├── docs/         # Swagger 自動生成文件
│   └── tests/        # 單元 + 整合測試
├── frontend/         # React SPA
│   └── src/
│       ├── pages/    # board-list/ · board-detail/ · pin/
│       ├── hooks/    # TanStack Query hooks（board/ card/ checklist/ comment/ dependency/ tag/）
│       ├── stores/   # Zustand（themeStore、pinStore）
│       ├── lib/      # API client（boards · cards · columns · tags · checklists · comments · dependencies · images）
│       └── routes/   # TanStack Router 路由
├── electron/         # Electron 主程序
│   ├── main.js       # 主程序（生命週期、視窗、系統列）
│   ├── preload.js    # Context bridge（安全 IPC）
│   ├── icons/        # 應用程式圖示
│   └── resources/    # 打包用 Go backend 執行檔
├── openspec/         # Spec-driven 開發規格
│   ├── config.yaml   # openspec 設定
│   ├── specs/        # 功能規格（每個功能一個子目錄）
│   └── changes/      # 變更記錄
├── .github/
│   └── workflows/
│       └── release.yml      # Tag 觸發的自動打包與 Release 發佈
├── scripts/          # 輔助建置腳本
│   ├── build.bat           # 一鍵打包腳本（Windows Batch）
│   └── patch-rcedit.js    # postinstall hook：修補 electron-builder rcedit 問題
├── Makefile          # 快捷指令（make dev / backend / frontend / electron）
├── package.json      # 根層 Electron 設定 + electron-builder
└── docker-compose.yml
```

## API 端點

| 方法             | 路徑                                    | 說明                     |
| ---------------- | --------------------------------------- | ------------------------ |
| GET              | `/api/health`                           | 健康檢查                 |
| GET/POST         | `/api/v1/boards`                        | 列出/建立看板            |
| GET/PUT/DELETE   | `/api/v1/boards/:id`                    | 取得/更新/刪除看板       |
| POST             | `/api/v1/boards/:id/columns`            | 新增欄位                 |
| GET              | `/api/v1/boards/:id/dependencies`       | 看板所有依賴關係         |
| GET              | `/api/v1/boards/:id/images/:filename`   | 讀取圖片                 |
| PATCH/DELETE     | `/api/v1/columns/:id`                   | 更新/刪除欄位            |
| POST             | `/api/v1/columns/:id/cards`             | 新增卡片                 |
| GET              | `/api/v1/cards/pinned`                  | 取得所有釘選卡片         |
| GET              | `/api/v1/cards/search`                  | 跨欄搜尋卡片             |
| GET/PATCH/DELETE | `/api/v1/cards/:id`                     | 取得/更新/刪除卡片       |
| PATCH            | `/api/v1/cards/:id/move`                | 移動卡片（換欄/排序）    |
| PATCH            | `/api/v1/cards/:id/pin`                 | 切換釘選狀態             |
| PATCH            | `/api/v1/cards/:id/schedule`            | 更新截止日期             |
| POST             | `/api/v1/cards/:id/duplicate`           | 複製卡片                 |
| POST/DELETE      | `/api/v1/cards/:id/tags`                | 附加/移除卡片標籤        |
| GET/POST         | `/api/v1/cards/:id/checklists`          | 列出/新增 Checklist      |
| GET/POST         | `/api/v1/cards/:id/dependencies`        | 列出/新增卡片依賴        |
| POST             | `/api/v1/cards/:id/comments`            | 新增留言                 |
| POST             | `/api/v1/cards/:id/images`              | 上傳圖片                 |
| DELETE           | `/api/v1/dependencies/:id`              | 刪除依賴關係             |
| GET/POST         | `/api/v1/tags`                          | 列出/建立標籤            |
| PATCH/DELETE     | `/api/v1/tags/:id`                      | 更新/刪除標籤            |
| PATCH/DELETE     | `/api/v1/checklists/:id`                | 更新/刪除 Checklist      |
| POST             | `/api/v1/checklists/:id/items`          | 新增檢查項目             |
| PUT              | `/api/v1/checklists/:id/items`          | 同步檢查項目             |
| PATCH/DELETE     | `/api/v1/checklist-items/:id`           | 更新/刪除檢查項目        |
| PATCH            | `/api/v1/checklist-items/:id/move`      | 移動檢查項目             |
| PATCH/DELETE     | `/api/v1/comments/:id`                  | 更新/刪除留言            |

完整 API 文件請見 Swagger UI：`http://localhost:34115/swagger/index.html`
