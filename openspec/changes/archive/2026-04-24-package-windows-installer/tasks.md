## 1. 修改 Electron 主程序

- [x] 1.1 修改 `electron/main.js` 的 `startBackend()` 函式，在 `spawn(exe, [...])` 中加入 `--workspace` 參數，值為 `path.join(app.getPath('userData'), 'workspace')`

## 2. 新增打包腳本

- [x] 2.1 建立 `scripts/build.sh`（開頭加 `set -e`），依序執行：編譯 Go backend → 建置前端 → electron-builder --win
- [x] 2.2 修改根目錄 `package.json` 的 `electron:package` script 為 `"bash scripts/build.sh"`
- [x] 2.3 在 `Makefile` 新增 `package` target，執行 `bash scripts/build.sh`

## 3. 修正 electron-builder 設定

- [x] 3.1 在根目錄 `package.json` 的 `build.files` 中加入 `!electron/resources/**`，避免 binary 同時被打包進 asar 和 extraResources 造成重複

## 4. 版本控制排除設定

- [x] 4.1 在根目錄 `.gitignore` 新增 `electron/resources/` 和 `dist-electron/` 的排除規則（若尚未存在）

## 5. 驗證

- [x] 5.1 執行 `make package`，確認 `dist-electron/PinFlow Setup *.exe` 產出
- [x] 5.2 安裝後開啟 PinFlow，確認 `%APPDATA%\PinFlow\workspace\` 目錄被建立並包含 `manifest.json`
- [x] 5.3 新增看板 → 關閉 → 重新開啟，確認資料持久化正常
