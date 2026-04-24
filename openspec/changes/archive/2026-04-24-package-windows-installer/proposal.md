## Why

PinFlow 目前只能透過 `make dev` 開發模式執行，沒有可供非技術用戶安裝使用的封裝流程。為了讓一般用戶只需執行一個安裝檔即可使用，需要建立完整的 Windows NSIS 安裝包打包流程。

## What Changes

- 新增 `scripts/build.sh`：一鍵自動化打包腳本（編譯 Go backend → 建置前端 → 封裝 Electron NSIS 安裝檔）
- 修改 `electron/main.js`：生產模式啟動 backend 時傳入 `--workspace` 參數，指向 `app.getPath('userData') + '/workspace'`（`%APPDATA%\PinFlow\workspace`）
- 更新根目錄 `package.json`：修改既有 `electron:package` script 改為呼叫 build.sh，並在 `build.files` 排除 `electron/resources/**`
- 更新 `Makefile`：新增 `package` target

## Capabilities

### New Capabilities

- `windows-installer`: 將 PinFlow 封裝為 Windows NSIS 安裝檔的完整打包流程，包含 Go backend 編譯、前端建置、Electron Builder 打包，以及安裝後資料路徑的正確設定。

### Modified Capabilities

（無）

## Impact

- **`electron/main.js`**：修改 `startBackend()` 函式，加入 `--workspace` 參數傳遞
- **`package.json`**（根目錄）：修改 `electron:package` script，新增 `!electron/resources/**` 至 `build.files`
- **`Makefile`**：新增 `package` target
- **新增 `scripts/build.sh`**：打包自動化腳本
- **新增 `electron/resources/`**：放置編譯後的 Go backend binary（由 build.sh 產生，不納入 git）
- **`dist-electron/`**：打包輸出目錄（不納入 git）
