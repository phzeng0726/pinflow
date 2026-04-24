## 1. Backend: Model & Store

- [x] 1.1 新增 `backend/model/settings.go`，定義 `Settings` struct（Theme、Locale string）
- [x] 1.2 在 `backend/store/store.go` 的 `FileStore` struct 新增 `settings *model.Settings` 欄位
- [x] 1.3 在 `store.go` 的 `load()` 方法中讀取 `settings.json`（不存在則初始化預設值並寫入）
- [x] 1.4 在 `store.go` 新增 `GetSettings()`、`UpdateSettings()`、`persistSettings()` 方法

## 2. Backend: Repository

- [x] 2.1 新增 `backend/repository/settings_repository.go`，定義 `SettingsRepository` interface 與 `settingsRepository` 實作
- [x] 2.2 在 `backend/repository/repository.go` 的 `Repositories` struct 加入 `Settings SettingsRepository`，並在 `NewRepositories()` 中初始化

## 3. Backend: Service

- [x] 3.1 新增 `backend/service/settings_service.go`，定義 `SettingsService` interface 與 `settingsService` 實作（GetSettings、UpdateSettings）
- [x] 3.2 在 `backend/service/service.go` 的 `Services` struct 加入 `Settings SettingsService`，並在 `NewServices()` 中初始化

## 4. Backend: DTO & Handler & Router

- [x] 4.1 新增 `backend/dto/settings_dto.go`，定義 `UpdateSettingsRequest`（`Theme *string`、`Locale *string`）與 `SettingsResponse`
- [x] 4.2 新增 `backend/api/settings_handler.go`，實作 `GetSettings`、`UpdateSettings` handler（含 Swagger godoc）
- [x] 4.3 在 `backend/api/handler.go` 的 `Handlers` struct 加入 `Settings *SettingsHandler`，並在 `NewHandlers()` 中初始化
- [x] 4.4 在 `backend/api/router.go` 新增路由 `GET /api/v1/settings` 與 `PUT /api/v1/settings`
- [x] 4.5 執行 `cd backend && swag init` 重新產生 Swagger 文件

## 5. Frontend: API & Types

- [x] 5.1 在 `frontend/src/types/index.ts` 新增 `Settings` interface（`theme: string`、`locale: string`）
- [x] 5.2 新增 `frontend/src/lib/api/settings.ts`，實作 `getSettings()` 與 `updateSettings(data)`
- [x] 5.3 在 `frontend/src/lib/api/index.ts` 加入 `export * from './settings'`

## 6. Frontend: Hooks

- [x] 6.1 在 `frontend/src/hooks/queryKeys.ts` 新增 `settings: { all: () => ['settings'] as const }`
- [x] 6.2 新增 `frontend/src/hooks/settings/queries/useSettings.ts`（useQuery）
- [x] 6.3 新增 `frontend/src/hooks/settings/mutations/useUpdateSettings.ts`（useMutation，onMutate 即時更新 store）

## 7. Frontend: Stores

- [x] 7.1 更新 `frontend/src/stores/themeStore.ts`：移除 `persist` middleware；`toggle()` 先更新 Zustand store（即時 UI 反應），再 fire-and-forget 呼叫 `updateSettings({ theme: next })`；保留 `window.electronAPI?.broadcastSettings?.()` 呼叫
- [x] 7.2 更新 `frontend/src/stores/localeStore.ts`：移除 `persist` middleware；`toggle()` 先更新 Zustand store（即時 UI 反應），再 fire-and-forget 呼叫 `updateSettings({ locale: next })`；保留 `window.electronAPI?.broadcastSettings?.()` 呼叫

## 8. Frontend: Root Hydration

- [x] 8.1 更新 `frontend/src/routes/__root.tsx`：啟動時呼叫 `getSettings()`，並將回傳值套用至 themeStore 與 localeStore（透過 `setState` + `apply()`）

## 9. Verification

- [x] 9.1 執行 `cd backend && go build ./...` 確認後端編譯無誤
- [x] 9.2 執行 `cd frontend && pnpm build` 確認前端編譯無誤
- [x] 9.3 手動測試：切換 theme/locale → 重啟應用程式 → 確認設定持久化
