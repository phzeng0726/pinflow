## ADDED Requirements

### Requirement: Tag 觸發自動打包
系統 SHALL 在 git tag 符合 `v*` 格式（例如 `v0.1.0`、`v1.2.3-rc1`）被推送到 GitHub 時，自動觸發 GitHub Actions workflow，在 `windows-latest` runner 上完成完整的 PinFlow 打包流程。

#### Scenario: 推送 v* tag 觸發 workflow
- **WHEN** 開發者執行 `git tag v0.1.0 && git push origin v0.1.0`
- **THEN** GitHub Actions 的 "Release" workflow 自動啟動，runner 為 `windows-latest`

#### Scenario: 非 v* tag 不觸發 workflow
- **WHEN** 開發者推送不符合 `v*` 格式的 tag（例如 `test-build`）
- **THEN** "Release" workflow 不啟動

### Requirement: 版號與 tag 一致
系統 SHALL 在打包前將 tag 版號（去除 `v` 前綴）寫入 root `package.json` 的 `version` 欄位，使 electron-builder 輸出的安裝包名稱與 tag 一致，此操作僅在 CI runner 內執行，不 commit 回 repo。

#### Scenario: tag v0.1.0 產出正確版號的安裝包
- **WHEN** tag `v0.1.0` 觸發 workflow 並完成打包
- **THEN** `dist-electron/` 中的安裝包檔名包含 `0.1.0`（例如 `PinFlow Setup 0.1.0.exe`）

#### Scenario: 未手動 bump package.json 仍可正確打包
- **WHEN** 開發者只推送 tag，未修改 `package.json` 中的版號
- **THEN** CI 自動從 tag 取得版號，打包結果版號正確

### Requirement: 自動化打包三步驟
系統 SHALL 依序執行以下三個步驟，任一步驟失敗時立即中止 workflow：
1. Go backend 編譯：`go build -o ../electron/resources/pinflow-backend.exe .`（在 `backend/` 下執行）
2. 前端 build：`pnpm --filter frontend build`（帶 `ELECTRON_BUILD=1` 環境變數）
3. Electron 打包：`pnpm exec electron-builder --win`

#### Scenario: 完整打包成功
- **WHEN** 三個步驟均成功
- **THEN** `dist-electron/` 目錄下存在 `*.exe` 安裝包與 `latest.yml`

#### Scenario: Go 編譯失敗時中止
- **WHEN** Go backend 編譯失敗（語法錯誤、缺少依賴）
- **THEN** workflow 標記為失敗，不繼續執行前端 build 與 electron 打包

### Requirement: 發佈至 GitHub Releases
系統 SHALL 在打包完成後，將 `dist-electron/` 目錄下的 `.exe`、`.exe.blockmap`、`latest.yml` 上傳至對應 tag 的 GitHub Release，Release 設定為已發佈（非 draft），並自動產生 release notes。

#### Scenario: Release 包含可下載的安裝包
- **WHEN** workflow 完成
- **THEN** GitHub 的 Releases 頁面出現對應 tag 的 Release，附件包含 `PinFlow Setup <version>.exe`

#### Scenario: GITHUB_TOKEN 自動授權
- **WHEN** workflow 觸發
- **THEN** 無需手動設定 PAT secret，`GITHUB_TOKEN` 由 Actions 自動提供，且 workflow 宣告 `permissions: contents: write`

### Requirement: Workflow 使用固定版本依賴
系統 SHALL 使用以下固定版本以確保可重現性：
- Go：`1.25`
- Node.js：`20`
- pnpm：`9`
- actions/checkout：`v4`
- actions/setup-go：`v5`
- pnpm/action-setup：`v4`
- actions/setup-node：`v4`
- softprops/action-gh-release：`v2`

#### Scenario: 依賴版本不因上游更新而改變
- **WHEN** workflow 在任意時間點執行
- **THEN** 使用的 action 版本與 spec 定義一致，不受上游 major version 更新影響
