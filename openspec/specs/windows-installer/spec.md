## ADDED Requirements

### Requirement: 一鍵打包腳本
系統 SHALL 提供 `scripts/build.sh`（含 `set -e`），執行後依序完成：Go backend 編譯、React 前端建置、Electron Builder NSIS 打包，最終在 `dist-electron/` 產出安裝檔。

#### Scenario: 成功執行打包
- **WHEN** 執行 `pnpm run electron:package`（或 `make package`）
- **THEN** 依序完成三個步驟（Go 編譯 → 前端 build → electron-builder），並在 `dist-electron/` 產出 `PinFlow Setup <version>.exe`

#### Scenario: Go 編譯失敗時中止
- **WHEN** Go backend 編譯失敗（語法錯誤、依賴缺失）
- **THEN** 腳本立即中止（`set -e`），不繼續執行後續步驟

### Requirement: Go backend binary 放置於 extraResources 目錄
系統 SHALL 將編譯後的 `pinflow-backend.exe` 輸出到 `electron/resources/` 目錄，使 electron-builder 的 `extraResources` 設定能自動將其打包進安裝包。`build.files` 須排除 `!electron/resources/**`，避免 binary 同時被打包進 asar 造成重複。

#### Scenario: Binary 正確打包進安裝包
- **WHEN** 打包流程完成後安裝 app
- **THEN** 安裝目錄的 `resources/pinflow-backend.exe` 存在且可執行

#### Scenario: Binary 不重複打包
- **WHEN** 打包流程完成
- **THEN** `pinflow-backend.exe` 僅存在於 `resources/` 目錄，不會同時被包進 asar archive

### Requirement: 生產模式 backend 使用 userData/workspace 作為 workspace
Electron 主程序 SHALL 在生產模式啟動 backend 時，傳遞 `--workspace <path.join(app.getPath('userData'), 'workspace')>` 參數，使資料儲存於 `%APPDATA%\PinFlow\workspace\`，與 Electron 內部資料分離。

#### Scenario: 首次安裝後啟動
- **WHEN** 用戶安裝後首次開啟 PinFlow
- **THEN** backend 在 `%APPDATA%\PinFlow\workspace\` 下自動建立 workspace（`manifest.json`、`tags.json`、`boards/`）

#### Scenario: 資料在重啟後持久保存
- **WHEN** 用戶新增看板後關閉並重新開啟 PinFlow
- **THEN** 先前建立的看板資料仍然存在

#### Scenario: workspace 資料與 Electron 內部資料分離
- **WHEN** 查看 `%APPDATA%\PinFlow\` 目錄
- **THEN** PinFlow 的 workspace 資料（manifest.json、tags.json、boards/）僅在 `workspace/` 子目錄中，不與 Electron 的 Local Storage、Cache 等混在一起

### Requirement: NSIS 安裝程式允許用戶自選安裝目錄
安裝程式 SHALL 在安裝過程中顯示選擇安裝目錄的畫面，允許用戶安裝到非 C 槽的路徑。

#### Scenario: 用戶選擇自訂安裝目錄
- **WHEN** 用戶在安裝過程中選擇 `D:\Apps\PinFlow` 作為安裝目錄
- **THEN** App 安裝到 `D:\Apps\PinFlow\`，資料仍存在 `%APPDATA%\PinFlow\workspace\`

#### Scenario: 建立桌面捷徑與開始功能表捷徑
- **WHEN** 安裝完成
- **THEN** 桌面和開始功能表均有 PinFlow 的捷徑

### Requirement: electron/resources 不納入版本控制
`electron/resources/` 目錄 SHALL 加入 `.gitignore`，避免將編譯後的 binary 提交至 git。

#### Scenario: 新開發者 clone 專案後
- **WHEN** 新開發者 clone 專案並執行 `make package`
- **THEN** build.sh 自動建立 `electron/resources/` 並編譯 binary，無需手動操作
