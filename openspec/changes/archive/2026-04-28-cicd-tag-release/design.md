## Context

目前 PinFlow 沒有任何 CI/CD 設定。本機打包依賴 `scripts/build.bat`（需在 Windows 環境手動執行），發版流程依賴人工操作，存在版號不一致與遺漏上傳的風險。

打包流程包含三個相依步驟：
1. Go backend 編譯為 `electron/resources/pinflow-backend.exe`
2. React 前端 `pnpm --filter frontend build`（需 `ELECTRON_BUILD=1`）
3. `electron-builder --win` 產出 NSIS installer 至 `dist-electron/`

版號來源是 root `package.json` 的 `version` 欄位，`electron-builder` 用此欄位命名安裝包（例如 `PinFlow Setup 0.1.0.exe`）。

## Goals / Non-Goals

**Goals:**
- 推送 `v*` tag 觸發 GitHub Actions，在 `windows-latest` runner 自動完成打包
- 產出 NSIS `.exe` 並發佈至對應 tag 的 GitHub Release
- tag 版號（去除 `v` 前綴）自動注入 `package.json`，無需手動 bump

**Non-Goals:**
- macOS / Linux 打包（現有 electron-builder 設定有 mac/linux，但本 change 不處理）
- code-signing / SmartScreen 憑證
- `electron-updater` 自動更新整合
- 修改現有本機打包腳本 `scripts/build.bat`

## Decisions

### D1：Runner 使用 `windows-latest`
`electron-builder` 搭配 `rcedit`（用於設定 `.ico` 與版本資訊）在 Windows 原生環境最穩定。本專案 `postinstall` 已有 `scripts/patch-rcedit.js`，沿用 Windows runner 避免 wine 跨平台相容問題。

替代方案：Linux + wine — 可降低 runner 費用，但 `rcedit` 在 wine 下偶有 icon 設定失敗，除錯成本高。

### D2：版號以 tag 為唯一來源，runner 內覆寫 `package.json`
在 runner 內用 PowerShell `ConvertFrom-Json / ConvertTo-Json` 將 tag 版號寫入 `package.json`，僅影響 runner 環境，不 commit 回 repo。

替代方案：推 tag 前先手動 bump `package.json` — 需要雙重操作，容易忘記或版號打錯。

### D3：使用 `softprops/action-gh-release@v2` 上傳產物
不使用 `electron-builder --publish always`，而是在 build 完成後以獨立 step 上傳，這樣每個 step 在 Actions UI 有獨立 log，除錯更容易。

### D4：安裝 pnpm 使用 `pnpm/action-setup@v4`，版本固定為 9
與 `pnpm-workspace.yaml` 的 workspace 結構對應，確保 monorepo install 正確。

### D5：不重用 `scripts/build.bat`
build.bat 使用 `pushd/popd` 與 `errorlevel` 語義，在 Actions 中 step 顆粒度太粗。三個步驟直接展開為獨立 step，除錯與 log 更清晰。

## Risks / Trade-offs

- **`pnpm-lock.yaml` 未 commit** → Workflow 使用 `--frozen-lockfile`，若 lockfile 不存在會失敗。Mitigation：確認 lockfile 已提交（`git ls-files pnpm-lock.yaml`）。
- **Go 1.25 尚為 beta/rc** → GitHub Actions `actions/setup-go@v5` 若不支援 1.25 會失敗。Mitigation：確認 go.mod 要求的版本是否在 setup-go 支援清單，或改用 `stable` alias。
- **未簽署的 .exe 觸發 SmartScreen** → 首次下載會出現「Windows 已保護您的電腦」警告。已知風險，暫不處理。
- **首次 Release 建立 draft vs. published** → 設為 `draft: false`，tag 推送後立即公開。若需人工審查可改為 `draft: true`。

## Migration Plan

1. 確認 `pnpm-lock.yaml` 已 commit
2. 新增 `.github/workflows/release.yml`
3. 推送 pre-release tag（例如 `v0.0.1-test`）驗證 workflow 正確執行
4. 驗證完成後，正式推送 `v0.1.0` 完成第一個正式 Release
5. 若需 rollback：刪除 GitHub Release 與 `.github/workflows/release.yml` 即可，無其他副作用
