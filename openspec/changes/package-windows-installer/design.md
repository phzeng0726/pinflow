## Context

PinFlow 是 Electron + Go Backend + React Frontend 的桌面應用。目前開發模式透過 `make dev` 平行啟動三個進程，但沒有針對終端用戶的安裝包。專案已預先設定了 `electron-builder` + NSIS，但缺少 Go 編譯步驟和 workspace 路徑的生產模式設定。

現有相關設定：
- 根目錄 `package.json`：`electron-builder` 設定，NSIS `allowToChangeInstallationDirectory: true`
- `electron/main.js`：生產模式從 `process.resourcesPath/pinflow-backend.exe` 啟動 backend，但沒有傳 `--workspace`
- `extraResources`：設定從 `electron/resources/` 複製 `pinflow-backend*` 到 resources 目錄

## Goals / Non-Goals

**Goals:**
- 建立一鍵打包腳本，產出 Windows NSIS 安裝檔
- 確保安裝後資料儲存在正確且可預期的路徑（`%APPDATA%\PinFlow`）
- 用戶安裝時可自選安裝目錄（已由 NSIS 設定支援）

**Non-Goals:**
- macOS / Linux 打包（本次只處理 Windows）
- 自動更新機制（electron-updater）
- CI/CD 自動化打包流程
- workspace 路徑的 UI 設定功能

## Decisions

### 決策 1：workspace 路徑使用 `app.getPath('userData')/workspace`

**選擇**：使用 Electron 的 `app.getPath('userData') + '/workspace'` 作為 workspace 目錄，透過 `--workspace` 參數傳給 Go backend。

**理由**：
- Windows 對應 `%APPDATA%\PinFlow\workspace\`（`C:\Users\<user>\AppData\Roaming\PinFlow\workspace\`）
- 符合 Windows 應用程式資料存放慣例
- 不同 Windows 用戶帳號的資料自動隔離
- 使用子目錄 `workspace/` 避免與 Electron 內部資料（Local Storage、Session Storage、Preferences、Cache 等）混在同一層
- 替代方案 1：使用 app 安裝目錄 → 拒絕，因為 Program Files 需要管理員權限寫入
- 替代方案 2：直接使用 `app.getPath('userData')` 根目錄 → 拒絕，會與 Electron 自身產生的檔案混雜

### 決策 2：打包腳本用 bash script（`scripts/build.sh`）

**選擇**：新增 `scripts/build.sh`，修改既有的 `electron:package` script 改為呼叫 `bash scripts/build.sh`。

**理由**：
- Makefile 已使用 `SHELL := /bin/bash`，環境一致
- 比 npm 跨平台腳本（cross-env、rimraf）更直觀
- 複用既有的 `electron:package` script，而非新增 `package:win` 造成重複
- 腳本須加上 `set -e` 確保任一步驟失敗時立即中止
- 替代方案：純 npm scripts → 拒絕，Go 編譯步驟不易嵌入

### 決策 3：Go binary 編譯輸出到 `electron/resources/`

**選擇**：`go build` 輸出到 `electron/resources/pinflow-backend.exe`，由 `electron-builder` 的 `extraResources` 自動複製進安裝包。

**理由**：`extraResources` 設定已存在，直接利用現有配置。

注意：`electron-builder` 的 `files` 設定中 `electron/**/*` 會把 `electron/resources/` 也包進 asar，導致 binary 重複打包。須在 `files` 中加入 `!electron/resources/**` 排除。

`electron/resources/` 加入 `.gitignore`，不提交 binary。

## Risks / Trade-offs

- **[風險] Go 交叉編譯環境**：在 Windows 上用 Git Bash 執行 `GOOS=windows GOARCH=amd64` 可能出現環境變數不生效的問題。→ 緩解：在 Windows 環境下直接 `go build`（預設就是 windows/amd64），不設 GOOS/GOARCH。
- **[風險] frontend/dist 路徑**：`electron-builder` 的 `files` 設定包含 `frontend/dist/**/*`，需確認前端 build 完成後才執行打包。→ 緩解：build.sh 按序執行，前端 build 在 electron-builder 之前。
- **[Trade-off] `%APPDATA%\PinFlow\workspace\` vs 安裝目錄旁**：`%APPDATA%` 是標準 Windows 慣例，但部分用戶可能希望資料與 app 在同一磁碟。→ 接受此 trade-off，未來可透過設定 UI 讓用戶變更路徑。

## Open Questions

（無）
