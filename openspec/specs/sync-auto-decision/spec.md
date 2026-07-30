# sync-auto-decision Specification

## Purpose
TBD - created by archiving change smart-sync-startup. Update Purpose after archive.
## Requirements
### Requirement: Cloud timestamp query
The sync client SHALL support querying the latest `updated_at` timestamp across all workspace files for the authenticated user via a single PostgREST request. When no workspace files exist, the method SHALL return nil.

#### Scenario: Cloud has files
- **WHEN** the authenticated user has workspace files in Supabase
- **THEN** `GetLatestUpdatedAt()` returns the most recent `updated_at` value across all rows

#### Scenario: Cloud is empty
- **WHEN** the authenticated user has no workspace files in Supabase
- **THEN** `GetLatestUpdatedAt()` returns nil without error

#### Scenario: Network error during query
- **WHEN** the Supabase API is unreachable
- **THEN** `GetLatestUpdatedAt()` returns an error and the caller degrades gracefully

### Requirement: Supabase updated_at trigger
The `workspace_files` table SHALL have a database trigger that sets `updated_at` to `now()` on every INSERT or UPDATE. The trigger SHALL be defined in a versioned SQL migration under `supabase/migrations/`.

#### Scenario: File upsert updates timestamp
- **WHEN** the sync client upserts a workspace file
- **THEN** the `updated_at` column is set to the current server time regardless of whether the client sends the field

#### Scenario: New file insert
- **WHEN** a new workspace file row is inserted
- **THEN** `updated_at` is set to the current server time

### Requirement: Persistent source decision state
The `Settings` model SHALL include `sourceDecisionMade` (bool), `lastSyncedAt` (nullable timestamp), and `lastSyncedUserId` (string) fields. These fields SHALL be persisted to `settings.json` with `omitempty` to maintain backward compatibility with older workspace files.

#### Scenario: Fresh workspace has no decision state
- **WHEN** a workspace created before this change is loaded
- **THEN** `sourceDecisionMade` defaults to `false`, `lastSyncedAt` defaults to nil, and `lastSyncedUserId` defaults to empty string

#### Scenario: Decision state survives restart
- **WHEN** the user completes a source decision and restarts the app
- **THEN** `settings.json` contains the persisted `sourceDecisionMade`, `lastSyncedAt`, and `lastSyncedUserId` values

### Requirement: Timestamp-based auto sync decision
When an authenticated session is established and `sourceDecisionMade` is `true` and `lastSyncedUserId` matches the current user, the sync manager SHALL compare the local `lastSyncedAt` with the cloud's latest `updated_at` to automatically determine the sync direction, without prompting the user.

#### Scenario: Cloud is newer than local
- **WHEN** the cloud `updated_at` exceeds local `lastSyncedAt` by more than 2 seconds
- **THEN** the sync manager automatically pulls from cloud, updates `lastSyncedAt`, and sets `SourceState.AutoAction` to `"pulled"`

#### Scenario: Local is newer than cloud
- **WHEN** the local `lastSyncedAt` exceeds cloud `updated_at` by more than 2 seconds
- **THEN** the sync manager automatically pushes all local files to cloud, updates `lastSyncedAt`, and sets `SourceState.AutoAction` to `"pushed"`

#### Scenario: Timestamps are approximately equal
- **WHEN** the difference between local `lastSyncedAt` and cloud `updated_at` is within 2 seconds
- **THEN** the sync manager enables sync directly without pulling or pushing, as the data is considered synchronized

#### Scenario: Cloud has no files on returning session
- **WHEN** `sourceDecisionMade` is `true` and the cloud has no workspace files
- **THEN** the sync manager enables sync directly without prompting

#### Scenario: Network error on returning session
- **WHEN** `GetLatestUpdatedAt()` fails due to a network error on a returning session
- **THEN** the sync manager enables sync based on local settings without blocking app startup, and the error is logged

#### Scenario: User ID mismatch triggers first-time flow
- **WHEN** `sourceDecisionMade` is `true` but `lastSyncedUserId` does not match the current authenticated user ID
- **THEN** the sync manager treats this as a first-time decision (checks cloud for data, prompts if data exists)

### Requirement: First-time source decision marks completion
When a first-time source decision completes (user selects cloud or local, or cloud has no data), the sync manager SHALL set `sourceDecisionMade` to `true`, `lastSyncedUserId` to the current user ID, and `lastSyncedAt` to the current time in `settings.json`.

#### Scenario: First login with empty cloud
- **WHEN** a user authenticates for the first time and the cloud has no workspace files
- **THEN** `sourceDecisionMade` is set to `true`, `lastSyncedUserId` is set to the current user ID, sync is enabled per settings, and no dialog is shown

#### Scenario: First login with cloud data resolved
- **WHEN** a user authenticates for the first time, cloud has data, and the user selects a source
- **THEN** `sourceDecisionMade` is set to `true`, `lastSyncedUserId` is set, and `lastSyncedAt` is updated after the replacement completes

### Requirement: Sync timestamp update on successful push
The sync manager SHALL update `lastSyncedAt` in `settings.json` after every successful push operation (debounced push, manual full sync, or auto-push).

#### Scenario: Debounced push completes
- **WHEN** the debounced push successfully upserts all pending files
- **THEN** `lastSyncedAt` is updated to the current time

#### Scenario: Auto-push completes
- **WHEN** an auto-push triggered by timestamp comparison completes successfully
- **THEN** `lastSyncedAt` is updated to the current time

### Requirement: Auto-action notification via SourceState
`SourceState` SHALL include an `autoAction` string field (JSON: `autoAction`, omitempty). The field SHALL be set to `"pulling"` or `"pushing"` when auto sync starts, and `"pulled"` or `"pushed"` when it completes. The frontend SHALL use this field to display a toast notification.

#### Scenario: Auto-pull in progress
- **WHEN** auto-pull starts
- **THEN** `SourceState.AutoAction` is `"pulling"` and the frontend can display a syncing indicator

#### Scenario: Auto-pull completed
- **WHEN** auto-pull finishes successfully
- **THEN** `SourceState.AutoAction` transitions to `"pulled"` and the frontend shows a success toast

#### Scenario: Frontend toast on auto-sync completion
- **WHEN** the frontend detects `autoAction` is `"pulled"` or `"pushed"` via polling
- **THEN** a non-blocking toast notification is displayed and all workspace query caches are invalidated

