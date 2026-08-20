## ADDED Requirements

### Requirement: Supabase snapshot exclusion
The sync manager SHALL treat every workspace-relative path containing a `.snapshots` directory segment as local-only snapshot data. Such paths SHALL be excluded from Supabase uploads, cloud source detection, and cloud-to-local materialization. Existing cloud snapshot rows SHALL be ignored without requiring a dedicated cleanup operation.

#### Scenario: Incremental snapshot notification
- **WHEN** the sync manager receives an upsert or delete notification for a path under `boards/board-N/.snapshots/`
- **THEN** it performs no Supabase mutation for that path

#### Scenario: Cloud contains only snapshot rows
- **WHEN** source detection lists cloud rows and every row is under a `.snapshots` directory
- **THEN** the account is treated as having no cloud workspace data

#### Scenario: Existing snapshot rows are pulled
- **WHEN** Supabase returns snapshot rows together with syncable workspace rows
- **THEN** the snapshot rows are ignored and are not written into the local workspace

#### Scenario: Cloud workspace is pulled
- **WHEN** cloud data successfully replaces the local workspace
- **THEN** all existing local snapshots are removed regardless of workspace identity

#### Scenario: Cloud replacement fails
- **WHEN** cloud fetch, JSON decoding, or workspace JSON replacement fails
- **THEN** existing local snapshots remain unchanged

## MODIFIED Requirements

### Requirement: Full sync trigger
The sync manager SHALL support a manual full sync that reads all syncable JSON files in the workspace and upserts every one to Supabase. JSON files under a `.snapshots` directory SHALL NOT be syncable. This SHALL be triggered via `POST /api/v1/sync/trigger`.

#### Scenario: Manual full sync
- **WHEN** user triggers `POST /api/v1/sync/trigger`
- **THEN** sync manager scans the workspace, skips every `.snapshots` subtree, and upserts all other `.json` files to Supabase

#### Scenario: Manual full sync while source decision is pending
- **WHEN** user triggers `POST /api/v1/sync/trigger` before resolving the workspace source
- **THEN** no files are uploaded and the API reports that a source decision is required

### Requirement: Periodic reconciliation sync
The sync manager SHALL run a full reconciliation sync every 3 minutes while the user is authenticated and sync is enabled. The periodic sync SHALL run in the Go backend independently of renderer visibility and SHALL supplement, not replace, the 500 ms debounced push flow. Only one full sync SHALL run at a time. Snapshot JSON files under `.snapshots` directories SHALL be excluded from reconciliation.

The operating system MAY suspend all application processes during sleep. After resume, Electron SHALL renew an expired or near-expiry auth session and request a reconciliation sync. A transient failure SHALL not disable local usage, and a later scheduled or resume-triggered attempt SHALL be able to recover after authentication and connectivity return.

#### Scenario: Periodic full sync
- **WHEN** the user is authenticated, sync is enabled, and 3 minutes have elapsed since the previous reconciliation interval
- **THEN** sync manager scans syncable workspace JSON files, skips every `.snapshots` subtree, and upserts the remaining files to Supabase

#### Scenario: Renderer is hidden or minimized
- **WHEN** the application remains running with all renderer windows hidden, minimized, or in the system tray
- **THEN** the backend reconciliation interval continues without depending on renderer timers

#### Scenario: Computer is asleep
- **WHEN** the operating system suspends PinFlow processes
- **THEN** PinFlow makes no guarantee of synchronization during suspension

#### Scenario: Resume after sleep
- **WHEN** Electron receives an operating-system resume event and sync is enabled
- **THEN** it renews the session when necessary and requests a full reconciliation after renewal succeeds

#### Scenario: Periodic sync while disabled or unauthenticated
- **WHEN** the reconciliation interval elapses while sync is disabled or no renewable authenticated session exists
- **THEN** no Supabase request is made

#### Scenario: Periodic sync while source decision is pending
- **WHEN** the reconciliation interval elapses before the authenticated user resolves the workspace source
- **THEN** no Supabase request is made

#### Scenario: Reconciliation overlaps an active sync
- **WHEN** a periodic or resume-triggered reconciliation starts while another full sync is running
- **THEN** the new run is skipped rather than starting a concurrent full sync

#### Scenario: Periodic sync encounters an expired access token
- **WHEN** reconciliation receives an authentication error
- **THEN** sync reports renewal-required without discarding pending local data, and a later attempt runs after Electron renews the session

#### Scenario: Periodic sync while offline
- **WHEN** periodic reconciliation cannot reach Supabase
- **THEN** sync status becomes `offline` or `error` and a later interval or resume recovery may retry without blocking local app usage

### Requirement: Pull sync from cloud
The sync manager SHALL support replacing the local workspace with syncable workspace files from Supabase after the authenticated user explicitly selects cloud data as the source. Snapshot rows SHALL be excluded before local materialization.

The manager SHALL fetch and decode the complete cloud file set successfully before removing local managed JSON data. After syncable JSON replacement succeeds, all local `.snapshots` directories SHALL be removed regardless of workspace identity. Cloud fetch, JSON decoding, or workspace JSON replacement failure SHALL leave local snapshots unchanged. After replacement completes, `FileStore.ReloadAll()` SHALL reload all data into memory.

#### Scenario: Use cloud workspace
- **WHEN** an authenticated user selects "Use cloud data"
- **THEN** the sync manager replaces syncable local JSON, removes all local snapshots after replacement succeeds, and reloads the store

#### Scenario: Cloud fetch fails before replacement
- **WHEN** the complete cloud workspace cannot be fetched or decoded
- **THEN** local workspace data and local snapshots remain unchanged and the source decision remains pending

### Requirement: Replace cloud from local workspace
The sync manager SHALL support replacing all cloud workspace rows belonging to the authenticated user with the current syncable local workspace after the user explicitly selects local data as the source. Local files under `.snapshots` directories SHALL NOT be uploaded.

#### Scenario: Use this device workspace
- **WHEN** an authenticated user selects "Use this device's data"
- **THEN** the sync manager deletes that user's existing cloud workspace rows and uploads every managed local JSON file except files under `.snapshots` directories

#### Scenario: User data isolation during cloud replacement
- **WHEN** the cloud workspace is replaced from local data
- **THEN** rows belonging to other users are not read, modified, or deleted
