## 1. Supabase Migration

- [x] 1.1 Create `supabase/migrations/20260730000000_add_updated_at_trigger.sql` with trigger function that sets `updated_at = now()` on every INSERT/UPDATE of `workspace_files`

## 2. Backend Model & Store

- [x] 2.1 Add `SourceDecisionMade bool`, `LastSyncedAt *time.Time`, `LastSyncedUserID string` fields to `model.Settings` in `backend/model/settings.go` (all `omitempty`)
- [x] 2.2 Add `SetSourceDecisionMade(bool)`, `SetLastSyncedAt(time.Time)`, `SetLastSyncedUserID(string)` methods to `store/persistence.go` following `SetSyncEnabled` pattern

## 3. Sync Client — Cloud Timestamp Query

- [x] 3.1 Add `GetLatestUpdatedAt() (*time.Time, error)` to `CloudClient` interface in `backend/sync/manager.go`
- [x] 3.2 Implement `GetLatestUpdatedAt` in `backend/sync/client.go` — query `workspace_files?select=updated_at&order=updated_at.desc&limit=1`

## 4. Sync Types — SourceState Extension

- [x] 4.1 Add `AutoAction string` field (json `autoAction,omitempty`) to `SourceState` in `backend/sync/sync.go`

## 5. Manager — InitializeSourceDecision Refactor

- [x] 5.1 Extract current `InitializeSourceDecision` logic into `initFirstTimeSource()` private method in `backend/sync/manager.go`
- [x] 5.2 Implement `initReturningSource()` private method — calls `GetLatestUpdatedAt`, compares with `lastSyncedAt`, decides auto-pull/push/idle
- [x] 5.3 Refactor `InitializeSourceDecision()` to dispatch between first-time and returning paths based on `sourceDecisionMade` and `lastSyncedUserId`
- [x] 5.4 Implement `autoPull()` — fetch cloud files, replace local, update `lastSyncedAt`, set `AutoAction` to `"pulled"`
- [x] 5.5 Implement `autoPush()` — full sync local to cloud, update `lastSyncedAt`, set `AutoAction` to `"pushed"`

## 6. Manager — Timestamp Updates on Sync

- [x] 6.1 Update `push()` to call `store.SetLastSyncedAt(time.Now())` after successful push (before `setStatus("idle")`)
- [x] 6.2 Update `ReplaceLocalFromCloud()` to set `SourceDecisionMade=true`, `LastSyncedUserID`, `LastSyncedAt` after successful pull
- [x] 6.3 Update `ReplaceCloudFromLocal()` to set `SourceDecisionMade=true`, `LastSyncedUserID`, `LastSyncedAt` after successful push

## 7. Electron — loadSavedAuth Error Handling

- [x] 7.1 Refactor `loadSavedAuth()` in `electron/main.js` to log errors via `electron-log` and distinguish auth errors (delete `auth.dat`) from transient network errors (preserve `auth.dat`)

## 8. Frontend — Auto-Sync Toast Notification

- [x] 8.1 Add `useEffect` in `WorkspaceSourceDialog.tsx` to detect `source.data?.autoAction` === `"pulled"` or `"pushed"`, show toast via `sonner`, and invalidate all queries
- [x] 8.2 Add i18n keys `sync.autoPulled` and `sync.autoPushed` to `locales/zh-TW.json` and `locales/en-US.json`

## 9. Tests

- [x] 9.1 Add `GetLatestUpdatedAt` method to `fakeCloudClient` in `backend/tests/sync/manager_test.go`
- [x] 9.2 Add test: first-time login with empty cloud → `sourceDecisionMade` set to true, no dialog
- [x] 9.3 Add test: first-time login with cloud data → pending, dialog shown
- [x] 9.4 Add test: returning session, cloud newer → auto-pull triggered
- [x] 9.5 Add test: returning session, local newer → auto-push triggered
- [x] 9.6 Add test: returning session, timestamps equal → sync enabled directly
- [x] 9.7 Add test: returning session, network error → graceful degradation
- [x] 9.8 Add test: user ID mismatch → treated as first-time
- [x] 9.9 Update existing tests to accommodate new Settings fields

## 10. Verification

- [x] 10.1 Run `cd backend && go build ./...` — compile passes
- [x] 10.2 Run `cd backend && go test ./... -v` — all tests pass
- [x] 10.3 Run `cd frontend && pnpm build` — frontend builds successfully
