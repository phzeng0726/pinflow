## ADDED Requirements

### Requirement: Settings API
系統 SHALL 提供 `GET /api/v1/settings` 與 `PUT /api/v1/settings` API，供前端讀取與更新使用者設定（theme、locale）。

#### Scenario: 取得設定（首次，無 settings.json）
- **WHEN** 首次呼叫 `GET /api/v1/settings`（workspace 中尚無 `settings.json`）
- **THEN** 回傳 HTTP 200，body 為 `{ "theme": "light", "locale": "en-US" }`（預設值）

#### Scenario: 取得已儲存的設定
- **WHEN** workspace 中已有 `settings.json`，呼叫 `GET /api/v1/settings`
- **THEN** 回傳 HTTP 200，body 包含已儲存的 theme 與 locale 值

#### Scenario: 更新設定
- **WHEN** 呼叫 `PUT /api/v1/settings`，body 為 `{ "theme": "dark" }`
- **THEN** 回傳 HTTP 200，body 為合併後的完整設定；`settings.json` 寫入 workspace

#### Scenario: 部分更新（只更新 locale）
- **WHEN** 呼叫 `PUT /api/v1/settings`，body 為 `{ "locale": "zh-TW" }`
- **THEN** 回傳 HTTP 200，theme 維持不變，locale 更新為 `zh-TW`

### Requirement: Settings 持久化至 workspace
系統 SHALL 將設定存入 workspace 目錄的 `settings.json`，格式為 JSON object。

#### Scenario: settings.json 建立
- **WHEN** 第一次 `PUT /api/v1/settings` 成功
- **THEN** workspace 根目錄下出現 `settings.json`，包含 theme 與 locale 欄位

#### Scenario: 重啟後設定保留
- **WHEN** 儲存設定後重啟應用程式
- **THEN** `GET /api/v1/settings` 回傳上次儲存的設定值

### Requirement: 前端啟動時 hydrate
系統 SHALL 在應用程式啟動時呼叫 `GET /api/v1/settings`，並將結果套用至 themeStore 與 localeStore。

#### Scenario: 啟動時載入 dark theme
- **WHEN** `settings.json` 中 theme 為 `dark`，應用程式啟動
- **THEN** UI 以 dark mode 顯示，不需使用者手動切換

#### Scenario: 啟動時載入 zh-TW locale
- **WHEN** `settings.json` 中 locale 為 `zh-TW`，應用程式啟動
- **THEN** UI 以繁體中文顯示

### Requirement: 切換設定時寫回 API
系統 SHALL 在使用者切換 theme 或 locale 時，呼叫 `PUT /api/v1/settings` 將新值寫回後端。

#### Scenario: 切換 theme 後持久化
- **WHEN** 使用者點擊 theme toggle，從 light 切換至 dark
- **THEN** UI 即時更新為 dark mode，且 `PUT /api/v1/settings` 被呼叫寫入 `{ "theme": "dark" }`

#### Scenario: 切換 locale 後持久化
- **WHEN** 使用者點擊 locale toggle，從 en-US 切換至 zh-TW
- **THEN** UI 即時切換語系，且 `PUT /api/v1/settings` 被呼叫寫入 `{ "locale": "zh-TW" }`
