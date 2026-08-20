## MODIFIED Requirements

### Requirement: Supabase REST client
The sync package SHALL include a REST client that communicates with Supabase PostgREST API using `net/http`. The client SHALL support:

- `UpsertFile(path, content)` — upsert a row to `workspace_files` table
- `ListFiles()` — list all files for the authenticated user
- `DeleteFile(path)` — delete a specific file row

All requests SHALL include `apikey` and `Authorization: Bearer <access_token>` headers. On a 401 response, the client SHALL stop the request after one attempt, mark the current session as renewal-required, and return a typed authentication error. It SHALL NOT exchange or rotate a refresh token from the generic request path. Once Electron renews the backend session, a later sync attempt SHALL use the new access token.

#### Scenario: Upsert a file
- **WHEN** sync manager calls `UpsertFile("boards/board-1/board.json", content)` with a valid session
- **THEN** client sends `POST /rest/v1/workspace_files` with upsert headers and the file content as JSONB

#### Scenario: List all files
- **WHEN** sync manager calls `ListFiles()` with a valid session
- **THEN** client sends `GET /rest/v1/workspace_files` and returns all rows for the current user

#### Scenario: Delete a file
- **WHEN** sync manager calls `DeleteFile("boards/board-1/cards/card-5.json")` with a valid session
- **THEN** client sends `DELETE /rest/v1/workspace_files?path=eq.boards/board-1/cards/card-5.json`

#### Scenario: Token expired during API call
- **WHEN** a Supabase API call returns 401
- **THEN** client returns a typed renewal-required error without rotating credentials and the Electron session coordinator renews the backend session

#### Scenario: Request after coordinated renewal
- **WHEN** Electron has successfully renewed the backend session after an authentication error
- **THEN** the next sync request uses the new access token and can complete normally

### Requirement: Periodic reconciliation sync
The sync manager SHALL run a full reconciliation sync every 3 minutes while the user is authenticated and sync is enabled. The periodic sync SHALL run in the Go backend independently of renderer visibility and SHALL supplement, not replace, the 500 ms debounced push flow. Only one full sync SHALL run at a time.

The operating system MAY suspend all application processes during sleep. After resume, Electron SHALL renew an expired or near-expiry auth session and request a reconciliation sync. A transient failure SHALL not disable local usage, and a later scheduled or resume-triggered attempt SHALL be able to recover after authentication and connectivity return.

#### Scenario: Periodic full sync
- **WHEN** the user is authenticated, sync is enabled, and 3 minutes have elapsed since the previous reconciliation interval
- **THEN** sync manager scans all workspace JSON files and upserts them to Supabase

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
