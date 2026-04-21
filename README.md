# Pinflow

Trello 風格的看板任務管理系統，支援桌面懸浮釘選視窗。

## 功能

- **看板管理**：建立多個 Board，每個 Board 包含多個欄位（Column）
- **卡片管理**：在欄位內新增卡片，支援拖曳排序與跨欄移動
- **釘選模式**：手動將卡片釘選，懸浮顯示在桌面最上層
- **自動釘選**：設定欄位為「自動釘選」，移入該欄位的卡片自動釘選
- **檔案式儲存**：資料以 JSON 檔案儲存，可透過 Git 同步到不同裝置
- **Swagger UI**：內建 API 文件

## 技術棧

| 層級     | 技術                                                                                    |
| -------- | --------------------------------------------------------------------------------------- |
| Backend  | Go 1.25 · Gin · 檔案式 JSON 儲存 · Swagger                                              |
| Frontend | React 19 · TypeScript · Vite · Tailwind v3 · TanStack Query/Router · Zustand · @dnd-kit |
| Desktop  | Electron 40 (Windows)                                                                   |
| 部署     | Docker Compose                                                                          |

---

## 資料儲存

Pinflow 採用 **Bruno 風格的檔案式儲存**（無資料庫），所有資料以 JSON 檔案存放在 workspace 目錄中：

```
pinflow-workspace/
  manifest.json          # 版本 + ID 計數器
  tags.json              # 全域 Tag 定義
  boards/
    board-N/
      board.json         # Board 元資料
      columns.json       # 該 Board 的所有欄位
      cards/
        card-N.json      # 卡片（含 tag_ids + 內嵌 checklists）
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

開發模式需要分別啟動三個程序：

**終端機 1 — 啟動 Backend**

```bash
cd backend
go run . --workspace ../../pinflow-workspace
```

**終端機 2 — 啟動 Frontend 開發伺服器**

```bash
cd frontend
pnpm dev
```

**終端機 3 — 啟動 Electron**

```bash
pnpm electron:dev
```

> Electron 視窗會載入 `http://localhost:5173`（Vite dev server）。DevTools 會自動開啟。

也可以使用 `make` 指令來啟動：

```bash
make backend # 啟動 backend
make frontend # 啟動 frontend
make electron # 啟動 electron
make dev # 啟動 backend, frontend, electron
```

### 三、打包桌面安裝檔

#### 1. 編譯 Go backend 執行檔

**Windows（在 Git Bash / WSL）：**

```bash
bash scripts/build-backend.sh
```

**Windows（命令提示字元 / PowerShell）：**

```bat
scripts\build-backend.bat
```

編譯後的執行檔會放在 `electron/resources/pinflow-backend.exe`。

#### 2. 打包 Electron 安裝程式

```bash
pnpm electron:package
```

打包完成後安裝程式會在 `dist-electron/` 目錄下：

| 平台    | 產出檔案                                   |
| ------- | ------------------------------------------ |
| Windows | `Pinflow Setup 0.1.0.exe`（NSIS 安裝程式） |
| macOS   | `Pinflow-0.1.0.dmg`                        |
| Linux   | `Pinflow-0.1.0.AppImage`                   |

#### 3. 安裝與執行（Windows）

執行 `dist-electron/Pinflow Setup 0.1.0.exe`，依照安裝精靈完成安裝。安裝後從桌面捷徑或開始功能表啟動「Pinflow」。

> **提示：** 關閉主視窗後程式會縮小至系統列（System Tray），右鍵點擊托盤圖示可選擇「Open Pinflow」重新開啟或「Quit」完全關閉。

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
pnpm test
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

## 專案結構

```
pinflow/
├── backend/              # Go API server
│   ├── api/              # Handlers 容器（handler.go）+ Gin handlers + router.go
│   ├── service/          # Services 容器（service.go）+ 業務邏輯
│   ├── repository/       # Repositories 容器（repository.go）+ 檔案式實作
│   ├── store/            # FileStore（記憶體 + JSON 持久化）
│   ├── model/            # 資料模型
│   ├── dto/              # 請求/回應 DTO
│   ├── docs/             # Swagger 自動生成文件
│   └── tests/            # 單元 + 整合測試
├── frontend/             # React SPA
│   ├── src/
│   │   ├── pages/        # board-list/ · board-detail/ · pin/ 頁面
│   │   ├── hooks/        # TanStack Query hooks（依 domain 分組）
│   │   ├── stores/       # Zustand 狀態（themeStore、pinStore）
│   │   ├── lib/          # API client（依 domain 拆分）
│   │   └── routes/       # TanStack Router 路由
│   └── tests/
├── electron/             # Electron 主程序
│   ├── main.js           # 主程序（生命週期、視窗、系統列）
│   ├── preload.js        # Context bridge（安全 IPC）
│   ├── icons/            # 應用程式圖示
│   └── resources/        # 打包用 Go backend 執行檔
├── scripts/              # 輔助建置腳本
│   ├── build-backend.sh  # 編譯 Go binary（Unix）
│   └── build-backend.bat # 編譯 Go binary（Windows）
├── package.json          # 根層 Electron 設定 + electron-builder
├── docker-compose.yml
```

## API 端點

| 方法           | 路徑                           | 說明                  |
| -------------- | ------------------------------ | --------------------- |
| GET            | `/api/health`                  | 健康檢查              |
| GET/POST       | `/api/v1/boards`               | 列出/建立看板         |
| GET/PUT/DELETE | `/api/v1/boards/:id`           | 取得/更新/刪除看板    |
| POST           | `/api/v1/boards/:id/columns`   | 新增欄位              |
| PATCH/DELETE   | `/api/v1/columns/:id`          | 更新/刪除欄位         |
| POST           | `/api/v1/columns/:id/cards`    | 新增卡片              |
| GET            | `/api/v1/cards/pinned`         | 取得所有釘選卡片      |
| PATCH          | `/api/v1/cards/:id`            | 更新卡片              |
| PATCH          | `/api/v1/cards/:id/move`       | 移動卡片（換欄/排序） |
| PATCH          | `/api/v1/cards/:id/pin`        | 切換釘選狀態          |
| DELETE         | `/api/v1/cards/:id`            | 刪除卡片              |
| POST/DELETE    | `/api/v1/cards/:id/tags`       | 新增/移除卡片標籤     |
| POST           | `/api/v1/cards/:id/duplicate`  | 複製卡片              |
| GET/POST       | `/api/v1/cards/:id/checklists` | 列出/新增檢查清單     |
| GET/POST       | `/api/v1/tags`                 | 列出/建立標籤         |
| DELETE         | `/api/v1/checklists/:id`       | 刪除檢查清單          |
| POST           | `/api/v1/checklists/:id/items` | 新增檢查項目          |
| PATCH/DELETE   | `/api/v1/checklist-items/:id`  | 更新/刪除檢查項目     |

完整 API 文件請見 Swagger UI：`http://localhost:34115/swagger/index.html`
