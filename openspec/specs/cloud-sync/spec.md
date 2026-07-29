## Purpose

定義 PinFlow 工作區透過 Supabase 進行雲端同步的行為，包括本機寫入通知、推送與拉取、來源選擇、週期性 reconciliation、同步狀態 API 與前端介面。

## Requirements

### Requirement: Localized sync interface
All frontend UI introduced or changed by this capability SHALL use the application's i18n translation resources and provide both `en-US` and `zh-TW` values. User-facing text SHALL NOT be hard-coded in React components.

#### Scenario: Switching the application locale
- **WHEN** the user switches between English and Traditional Chinese
- **THEN** the sync status indicator and cloud pull dialog display the corresponding translated labels, descriptions, and accessibility text

### Requirement: Write notification channel
The `store/io.go` `writeJSON()` function SHALL send the written file's relative path (relative to workspace root) to a notification channel after every successful write. The send SHALL be non-blocking to avoid blocking the main application. A `SetWriteNotifier(ch chan<- string)` function SHALL be provided to register the channel.

#### Scenario: File write triggers notification
- **WHEN** `writeJSON()` successfully writes a file to disk
- **THEN** the file's relative path is sent to the registered notification channel

#### Scenario: No notifier registered
- **WHEN** `writeJSON()` is called and no notifier channel has been set
- **THEN** the write completes normally without attempting to send a notification

#### Scenario: Channel buffer full
- **WHEN** the notification channel buffer is full
- **THEN** the notification is dropped (non-blocking send) and the write still completes successfully

### Requirement: Delete notification
When boards, cards, or other entities are deleted from the store, the store SHALL send a delete notification with the format `delete:<relative-path>` to the write notification channel.

#### Scenario: Card deletion triggers delete notification
- **WHEN** a card is deleted via `store.DeleteCard()`
- **THEN** `delete:boards/board-N/cards/card-N.json` is sent to the notification channel

#### Scenario: Board deletion triggers delete notification
- **WHEN** a board is deleted via `store.DeleteBoard()`
- **THEN** delete notifications are sent for all files under `boards/board-N/`

### Requirement: Supabase REST client
The sync package SHALL include a REST client that communicates with Supabase PostgREST API using `net/http`. The client SHALL support:

- `UpsertFile(path, content)` — upsert a row to `workspace_files` table
- `ListFiles()` — list all files for the authenticated user
- `DeleteFile(path)` — delete a specific file row

All requests SHALL include `apikey` (anon key) and `Authorization: Bearer <access_token>` headers. On 401 response, the client SHALL trigger token refresh before retrying.

#### Scenario: Upsert a file
- **WHEN** sync manager calls `UpsertFile("boards/board-1/board.json", content)`
- **THEN** client sends `POST /rest/v1/workspace_files` with upsert headers and the file content as JSONB

#### Scenario: List all files
- **WHEN** sync manager calls `ListFiles()`
- **THEN** client sends `GET /rest/v1/workspace_files` and returns all rows for the current user

#### Scenario: Delete a file
- **WHEN** sync manager calls `DeleteFile("boards/board-1/cards/card-5.json")`
- **THEN** client sends `DELETE /rest/v1/workspace_files?path=eq.boards/board-1/cards/card-5.json`

#### Scenario: Token expired during API call
- **WHEN** a Supabase API call returns 401
- **THEN** client refreshes the token and retries the request once

### Requirement: Push sync with debounce
The sync manager SHALL run a background goroutine that reads from the write notification channel, debounces rapid writes (500ms after the last write), and batch-upserts changed files to Supabase.

The sync manager SHALL only push when:
1. The user is authenticated
2. Sync is enabled (`settings.syncEnabled` is true)
3. Network is available
4. No workspace source decision is pending

#### Scenario: Single file change
- **WHEN** a card is edited and `writeJSON()` fires a notification
- **THEN** after 500ms debounce, the sync manager reads the file from disk and upserts it to Supabase

#### Scenario: Rapid consecutive changes
- **WHEN** multiple files are changed within 500ms
- **THEN** the sync manager batches all changed paths and upserts them in a single batch after the debounce window

#### Scenario: Offline push
- **WHEN** a file change occurs but no network is available
- **THEN** the sync manager records the pending path and retries when connectivity is restored

#### Scenario: Sync disabled
- **WHEN** a file change occurs but `syncEnabled` is false
- **THEN** the notification is consumed but no Supabase request is made

#### Scenario: Workspace source decision pending
- **WHEN** a file change occurs while the authenticated user has not chosen between existing cloud data and local data
- **THEN** the notification is consumed but no Supabase request is made

### Requirement: Full sync trigger
The sync manager SHALL support a manual full sync that reads all JSON files in the workspace and upserts every one to Supabase. This SHALL be triggered via `POST /api/v1/sync/trigger`.

#### Scenario: Manual full sync
- **WHEN** user triggers `POST /api/v1/sync/trigger`
- **THEN** sync manager scans the entire workspace directory, reads every `.json` file, and upserts all to Supabase

#### Scenario: Manual full sync while source decision is pending
- **WHEN** user triggers `POST /api/v1/sync/trigger` before resolving the workspace source
- **THEN** no files are uploaded and the API reports that a source decision is required

### Requirement: Periodic reconciliation sync
The sync manager SHALL run a full reconciliation sync every 3 minutes while the user is authenticated and sync is enabled. The periodic sync SHALL supplement, not replace, the 500ms debounced push flow. Only one full sync SHALL run at a time.

#### Scenario: Periodic full sync
- **WHEN** the user is authenticated, sync is enabled, and 3 minutes have elapsed since the previous reconciliation interval
- **THEN** the sync manager scans all workspace JSON files and upserts them to Supabase

#### Scenario: Periodic sync while disabled or unauthenticated
- **WHEN** the reconciliation interval elapses while sync is disabled or the user is not authenticated
- **THEN** no Supabase request is made

#### Scenario: Periodic sync while source decision is pending
- **WHEN** the reconciliation interval elapses before the authenticated user resolves the workspace source
- **THEN** no Supabase request is made

#### Scenario: Reconciliation overlaps an active sync
- **WHEN** the reconciliation interval elapses while another full sync is already running
- **THEN** the periodic run is skipped rather than starting a concurrent full sync

#### Scenario: Periodic sync while offline
- **WHEN** a periodic reconciliation cannot reach Supabase
- **THEN** the sync status becomes `offline` or `error` and a later interval may retry without blocking local app usage

### Requirement: Pull sync from cloud
The sync manager SHALL support replacing the local workspace with all workspace files from Supabase after the authenticated user explicitly selects cloud data as the source.

The manager SHALL fetch the complete cloud file set successfully before removing local managed JSON data. After replacement completes, `FileStore.ReloadAll()` SHALL reload all data into memory.

#### Scenario: Use cloud workspace
- **WHEN** an authenticated user with existing cloud data selects "Use cloud data"
- **THEN** the sync manager fetches the complete cloud workspace, replaces local managed JSON data, and reloads the store

#### Scenario: Cloud fetch fails before replacement
- **WHEN** the complete cloud workspace cannot be fetched
- **THEN** local workspace data remains unchanged and the source decision remains pending

### Requirement: Replace cloud from local workspace
The sync manager SHALL support replacing all cloud workspace rows belonging to the authenticated user with the current local workspace after the user explicitly selects local data as the source.

#### Scenario: Use this device workspace
- **WHEN** an authenticated user selects "Use this device's data"
- **THEN** the sync manager deletes that user's existing cloud workspace rows and uploads every managed local JSON file

#### Scenario: User data isolation during cloud replacement
- **WHEN** the cloud workspace is replaced from local data
- **THEN** rows belonging to other users are not read, modified, or deleted

### Requirement: Workspace source decision
Every newly established or restored authenticated session SHALL check whether the account already has cloud workspace data. The backend SHALL expose the decision state and SHALL block automatic, manual, and periodic uploads while a decision is pending.

The sync API SHALL provide:

- `GET /api/v1/sync/source` returning whether cloud data exists and whether a decision is pending
- `POST /api/v1/sync/source` accepting `{source: "cloud" | "local"}` and performing the selected replacement

#### Scenario: Login with existing cloud data
- **WHEN** an auth session is established and the account has one or more cloud workspace rows
- **THEN** the source state becomes pending and no local data is uploaded before the user chooses a source

#### Scenario: Login without cloud data
- **WHEN** an auth session is established and the account has no cloud workspace rows
- **THEN** no source decision is required and the local example workspace remains available

#### Scenario: Decide later
- **WHEN** the user dismisses the workspace source dialog
- **THEN** neither local nor cloud data is modified, the source decision remains pending, and sync remains disabled

#### Scenario: Authentication changes
- **WHEN** the user logs out or signs in as a different user
- **THEN** any previous in-memory source decision is cleared and the new authenticated session is evaluated independently

### Requirement: FileStore ReloadAll
FileStore SHALL provide a `ReloadAll()` method that clears all in-memory maps and re-runs the `load()` function. This is needed after pull sync writes new files to disk.

#### Scenario: ReloadAll after pull
- **WHEN** `ReloadAll()` is called
- **THEN** all in-memory maps (boards, columns, cards, tags, etc.) are cleared and reloaded from the current workspace files on disk

### Requirement: Sync status API
The backend SHALL expose sync status endpoints under `/api/v1/sync/`:

- `GET /api/v1/sync/status` SHALL return `{state, lastSyncAt, error}` where state is one of: `idle`, `syncing`, `error`, `offline`, `disabled`
- `POST /api/v1/sync/trigger` SHALL trigger a full sync and return 202
- `PATCH /api/v1/sync/enable` SHALL accept `{enabled: bool}` to toggle sync on/off, persisting to `settings.syncEnabled`

#### Scenario: Get sync status
- **WHEN** frontend polls `GET /api/v1/sync/status`
- **THEN** backend returns current sync state, last successful sync timestamp, and any error message

#### Scenario: Enable sync
- **WHEN** frontend sends `PATCH /api/v1/sync/enable` with `{enabled: true}`
- **THEN** `settings.syncEnabled` is set to true and sync manager starts pushing changes

#### Scenario: Disable sync
- **WHEN** frontend sends `PATCH /api/v1/sync/enable` with `{enabled: false}`
- **THEN** sync manager stops pushing changes but auth session remains active

### Requirement: Sync status UI
The frontend SHALL display a `SyncStatusIndicator` component inside the app header action layout, positioned immediately before the Pinned Tasks action where that action exists. It SHALL participate in normal header layout and SHALL NOT use fixed or absolute positioning that can overlap other controls.

Clicking the indicator while authenticated SHALL open a dropdown containing:

- Authenticated account email
- Current sync state
- Last successful sync time
- Enable or disable sync action
- Manual "Sync now" action
- Logout action

- When not authenticated: show a cloud icon with login action
- When authenticated + idle: show a green checkmark with last sync time
- When syncing: show a spinning indicator
- When error: show a red warning with error message and manual retry button
- When offline: show a grey offline indicator
- When disabled: show a crossed-out cloud icon with enable action

#### Scenario: Unauthenticated user
- **WHEN** user is not logged in
- **THEN** SyncStatusIndicator shows a cloud icon; clicking it triggers login flow

#### Scenario: Sync in progress
- **WHEN** sync is actively pushing/pulling
- **THEN** SyncStatusIndicator shows a spinning animation

#### Scenario: Manual sync trigger
- **WHEN** user clicks the sync indicator while authenticated
- **THEN** a dropdown shows last sync time, sync state, and a "Sync now" button

#### Scenario: Header controls do not overlap
- **WHEN** the app header displays both SyncStatusIndicator and Pinned Tasks
- **THEN** both actions remain visible and independently clickable at all supported window sizes

#### Scenario: Enable sync from dropdown
- **WHEN** an authenticated user selects "Enable sync"
- **THEN** the frontend enables sync, refreshes status, and triggers an initial full sync

#### Scenario: Disable sync from dropdown
- **WHEN** an authenticated user selects "Disable sync"
- **THEN** the frontend disables automatic push and periodic reconciliation while keeping the auth session active

### Requirement: Workspace source dialog
When a user logs in and that account already has cloud workspace data, the frontend SHALL display a localized dialog asking which workspace should be retained.

The dialog SHALL offer:

- "Use cloud data" — replaces local workspace data
- "Use this device's data" — replaces cloud workspace data
- "Decide later" — closes the dialog without modifying either side

Each replacement action SHALL clearly state which side will be replaced and SHALL show progress while running.

#### Scenario: Existing cloud data after login
- **WHEN** user authenticates and the source API reports a pending decision
- **THEN** the workspace source dialog appears regardless of whether the local workspace contains the example board or user-created boards

#### Scenario: User selects cloud
- **WHEN** user selects "Use cloud data"
- **THEN** frontend confirms that local data will be replaced, calls `POST /api/v1/sync/source` with `{source: "cloud"}`, and invalidates all workspace query caches on success

#### Scenario: User selects this device
- **WHEN** user selects "Use this device's data"
- **THEN** frontend confirms that cloud data will be replaced, calls `POST /api/v1/sync/source` with `{source: "local"}`, and refreshes sync status on success

#### Scenario: User decides later
- **WHEN** user selects "Decide later"
- **THEN** the dialog closes without calling the source resolution endpoint and the user can reopen it from the authenticated sync dropdown

### Requirement: Supabase configuration
Supabase URL and anon key SHALL be configurable via environment variables `PINFLOW_SUPABASE_URL` and `PINFLOW_SUPABASE_ANON_KEY`. Release builds MAY embed deployment-specific defaults into `backend/sync/config.go` variables through Go linker flags. Environment variables SHALL take precedence over embedded values. Electron SHALL obtain the effective Supabase URL from the backend rather than maintaining a separate configuration source.

#### Scenario: Default configuration
- **WHEN** environment variables are not set and the release binary contains embedded Supabase values
- **THEN** backend uses the embedded Supabase URL and anon key and Electron uses the same effective URL

#### Scenario: No configuration
- **WHEN** neither environment variables nor embedded Supabase values are available
- **THEN** cloud authentication reports that Supabase is not configured while all local app functionality remains available

#### Scenario: Environment variable override
- **WHEN** `PINFLOW_SUPABASE_URL` and `PINFLOW_SUPABASE_ANON_KEY` are set
- **THEN** backend uses the environment variable values instead of defaults

### Requirement: Settings syncEnabled field
The `Settings` model SHALL include a `syncEnabled` boolean field (default: `false`). This field SHALL be persisted to `settings.json` and exposed via the existing `GET/PUT /api/v1/settings` endpoints.

#### Scenario: Default sync disabled
- **WHEN** a new workspace is created
- **THEN** `syncEnabled` defaults to `false`

#### Scenario: Toggle sync via settings
- **WHEN** user enables sync
- **THEN** `settings.json` is updated with `"syncEnabled": true`
