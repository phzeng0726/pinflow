## 1. 確認前置條件

- [x] 1.1 確認 `pnpm-lock.yaml` 已 commit（執行 `git ls-files pnpm-lock.yaml`，確保輸出非空）
- [x] 1.2 確認 Go 1.25 在 `actions/setup-go@v5` 支援清單中（或確認 go.mod 要求的版本）

## 2. 建立 GitHub Actions Workflow

- [x] 2.1 建立 `.github/workflows/` 目錄
- [x] 2.2 建立 `.github/workflows/release.yml`，設定觸發條件 `on: push: tags: ['v*']`，並宣告 `permissions: contents: write`
- [x] 2.3 新增 `checkout`、`extract-version`、`setup-go`、`setup-pnpm`、`setup-node` 步驟
- [x] 2.4 新增「Sync version into root package.json」步驟：用 PowerShell 將 tag 版號寫入 `package.json` 的 `version` 欄位
- [x] 2.5 新增 `pnpm install --frozen-lockfile` 步驟
- [x] 2.6 新增 Go backend build 步驟：`working-directory: backend`，執行 `go build -o ../electron/resources/pinflow-backend.exe .`
- [x] 2.7 新增 frontend build 步驟：帶 `ELECTRON_BUILD: '1'` 環境變數，執行 `pnpm --filter frontend build`
- [x] 2.8 新增 electron-builder 步驟：執行 `pnpm exec electron-builder --win`
- [x] 2.9 新增 `softprops/action-gh-release@v2` 步驟：上傳 `dist-electron/*.exe`、`dist-electron/*.exe.blockmap`、`dist-electron/latest.yml`，設定 `generate_release_notes: true`、`draft: false`

## 3. 驗證

- [ ] 3.1 推送 pre-release tag（例如 `v0.0.1-test`）觀察 Actions workflow 是否成功觸發並完成
- [ ] 3.2 確認 GitHub Releases 頁面出現對應 Release，附件包含 `PinFlow Setup 0.0.1-test.exe`
- [ ] 3.3 下載並安裝 `.exe`，確認 PinFlow 可正常啟動
- [ ] 3.4 清理測試 Release 與 tag：`gh release delete v0.0.1-test --yes && git push --delete origin v0.0.1-test && git tag -d v0.0.1-test`
