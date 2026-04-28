## Why

目前發版流程需開發者在本機手動執行 `scripts/build.bat`，再手動將 `.exe` 上傳到 GitHub，容易遺漏步驟或版號不一致。導入 tag-triggered CI/CD 後，推一個 `v*` tag 即可自動產出安裝包並發佈到 GitHub Releases，讓任何人可直接下載。

## What Changes

- 新增 `.github/workflows/release.yml`：在 `windows-latest` runner 上執行完整打包流程
- Workflow 依序完成：Go backend 編譯 → 前端 build → `electron-builder --win` → 上傳 `.exe` 到 GitHub Release
- 以 git tag（`v*`，例如 `v0.1.0`）作為唯一觸發條件
- CI 內部自動將 tag 版號（去除 `v` 前綴）寫入 root `package.json` 的 `version` 欄位，確保安裝包名稱與 tag 一致

## Capabilities

### New Capabilities
- `cicd-tag-release`: GitHub Actions workflow，在推送 `v*` tag 時自動打包 Windows NSIS `.exe` 並發佈至 GitHub Releases

### Modified Capabilities

（無需修改現有 spec 的需求，`windows-installer` spec 所定義的本機打包流程不受影響）

## Impact

- 新增檔案：`.github/workflows/release.yml`
- 不修改任何現有程式碼、設定或 spec
- 相依：GitHub Actions `windows-latest` runner、Go 1.25、Node 20、pnpm 9、`softprops/action-gh-release@v2`
- `GITHUB_TOKEN` 由 Actions 自動提供（`permissions: contents: write`），無需額外設定 secret
