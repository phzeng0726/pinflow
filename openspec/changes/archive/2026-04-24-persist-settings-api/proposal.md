## Why

PinFlow 在打包成 Electron 桌面版後，theme 與 locale 設定因依賴 `localStorage` 而無法跨重啟持久化。透過後端 API 將設定存入 workspace 的 `settings.json`，可確保桌面版與網頁版行為一致。

## What Changes

- 新增後端 `GET /api/v1/settings` 與 `PUT /api/v1/settings` API，將 `Settings`（theme、locale）存入 workspace 的 `settings.json`
- 前端啟動時從 API 載入設定來初始化 Zustand stores，切換設定時同步寫回 API
- 移除 themeStore 與 localeStore 的 Zustand `persist` middleware（不再依賴 `localStorage`）

## Capabilities

### New Capabilities
- `settings-persistence`: 後端 Settings API（GET/PUT `/api/v1/settings`），將 theme 與 locale 持久化至 workspace 的 `settings.json`；前端於啟動時從 API hydrate Zustand stores，切換時呼叫 API 更新

### Modified Capabilities
- `locale-switching`: 語系持久化儲存方式從 localStorage 改為後端 API；「預設語系為英文」scenario 改為「首次使用（無 settings.json 記錄）」

## Impact

- **後端**：新增 `model/settings.go`、`store` 方法、`repository/settings_repository.go`、`service/settings_service.go`、`api/settings_handler.go`，更新 `router.go`、`handler.go`、`repository.go`、`service.go`
- **前端**：新增 `lib/api/settings.ts`、`hooks/settings/` query 與 mutation hooks；更新 `stores/themeStore.ts`、`stores/localeStore.ts`、`routes/__root.tsx`
- **API Route**：新增 `GET /api/v1/settings`、`PUT /api/v1/settings`
- **不影響**：Electron IPC broadcast-settings（跨視窗同步）、Web 模式（同樣走 API）
