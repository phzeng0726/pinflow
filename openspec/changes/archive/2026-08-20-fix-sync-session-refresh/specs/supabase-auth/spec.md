## MODIFIED Requirements

### Requirement: Backend auth session endpoints
The backend SHALL expose auth session management endpoints under `/api/v1/auth/`.

- `POST /api/v1/auth/session` SHALL accept `{accessToken, refreshToken}`, validate a supplied access token against Supabase Auth API (`GET /auth/v1/user`), or exchange the supplied refresh token when the access token is empty or invalid. It SHALL store the resulting access-token auth state in memory and return `{authenticated: true, userId, email, refreshToken, expiresAt}` on success. The returned refresh token SHALL be the latest rotated token received from Supabase.
- `GET /api/v1/auth/session` SHALL return the current auth status `{authenticated: bool, userId?, email?, expiresAt?, renewalRequired?}` and SHALL NOT return a refresh token.
- `DELETE /api/v1/auth/session` SHALL clear the stored auth state and return 200.

#### Scenario: Successful session creation
- **WHEN** Electron sends `POST /api/v1/auth/session` with valid Supabase tokens
- **THEN** backend validates the access token, stores auth state and expiry, and returns the authenticated identity, current refresh token, and access-token expiry

#### Scenario: Restore session with refresh token
- **WHEN** Electron sends `POST /api/v1/auth/session` with an empty access token and a valid persisted refresh token
- **THEN** backend exchanges it with Supabase and returns the newly rotated refresh token and expiry

#### Scenario: Invalid token
- **WHEN** Electron sends `POST /api/v1/auth/session` and neither supplied token can establish a valid session
- **THEN** backend returns 401 with an error message and reports an unauthenticated session

#### Scenario: Check auth status when not authenticated
- **WHEN** frontend or Electron sends `GET /api/v1/auth/session` and no session exists
- **THEN** backend returns `{authenticated: false}` without exposing credential data

#### Scenario: Logout
- **WHEN** Electron sends `DELETE /api/v1/auth/session`
- **THEN** backend clears stored auth state and returns 200

### Requirement: Coordinated token refresh
The Electron main process SHALL be the durable owner and coordinator of Supabase refresh-token rotation. The backend SHALL exchange a refresh token only through `POST /api/v1/auth/session`; generic cloud-sync REST requests SHALL NOT silently rotate refresh tokens.

Electron SHALL schedule renewal before the current access token expires, persist the returned rotated refresh token with `safeStorage`, and then schedule the next renewal. If a Supabase cloud request receives 401 before renewal completes, the backend SHALL mark the session as renewal-required without attempting a concurrent refresh-token exchange.

#### Scenario: Scheduled token refresh
- **WHEN** the authenticated access token approaches its expiry
- **THEN** Electron decrypts the persisted refresh token, establishes a renewed backend session, atomically persists the returned rotated refresh token, and schedules the next renewal

#### Scenario: Token expires during cloud request
- **WHEN** a Supabase cloud request returns 401
- **THEN** backend marks the session as renewal-required and Electron performs the refresh-token exchange without a second concurrent refresher

#### Scenario: Refresh succeeds
- **WHEN** Supabase accepts the current refresh token
- **THEN** backend stores the new access-token state and Electron replaces `auth.dat` with the newly rotated refresh token before reporting renewal success

#### Scenario: Refresh token is invalid or revoked
- **WHEN** Supabase rejects the persisted refresh token as invalid or revoked
- **THEN** Electron deletes `auth.dat`, clears the backend auth session, emits `auth:changed`, and subsequent `GET /api/v1/auth/session` returns `{authenticated: false}`

#### Scenario: Refresh fails because the network is unavailable
- **WHEN** session renewal fails due to a transient network error
- **THEN** Electron preserves `auth.dat`, keeps local functionality available, and retries renewal with bounded backoff

### Requirement: Electron OAuth flow
Electron main process SHALL provide an OAuth flow that opens the system browser for Google login via Supabase Auth.

The flow SHALL:
1. Start a temporary HTTP server on a local port (default 34116)
2. Open the system default browser to the Supabase OAuth URL with `redirect_to` pointing to the local server
3. Receive the auth callback with tokens
4. Send tokens to Go backend via `POST /api/v1/auth/session`
5. Encrypt the refresh token returned by the backend using `safeStorage.encryptString()` and atomically save it to `{userData}/auth.dat`
6. Schedule session renewal using the returned expiry
7. Close the temporary server
8. Notify the renderer process via IPC `auth:changed`

On app restart, `loadSavedAuth()` SHALL decrypt the saved refresh token, send it to the backend via `POST /api/v1/auth/session`, atomically persist the newly rotated token from the response, schedule renewal, and restore the authenticated session. On failure, it SHALL distinguish between authentication errors and transient errors. Authentication errors SHALL delete `auth.dat`; transient errors SHALL preserve `auth.dat` for retry. All failures SHALL be logged via `electron-log`.

Electron SHALL listen for operating-system resume. After resume, it SHALL renew an expired or near-expiry session before triggering reconciliation. These lifecycle operations SHALL run in Electron main and SHALL NOT depend on renderer visibility or renderer timers.

#### Scenario: First-time login
- **WHEN** user completes Google login
- **THEN** backend establishes the session, Electron atomically stores the returned refresh token, schedules renewal, and the app shows authenticated state

#### Scenario: App restart with saved token
- **WHEN** app starts and `{userData}/auth.dat` contains a valid refresh token
- **THEN** Electron exchanges it, atomically stores the rotated token returned by backend, schedules renewal, and restores authenticated state automatically

#### Scenario: App restart with invalid token
- **WHEN** app starts and the saved refresh token is invalid or revoked
- **THEN** `loadSavedAuth()` logs the authentication failure, deletes `auth.dat`, clears backend auth, and the app shows unauthenticated state

#### Scenario: App restart with network error
- **WHEN** app starts and the backend or Supabase is temporarily unreachable
- **THEN** `loadSavedAuth()` logs the error, preserves `auth.dat`, and schedules a bounded retry without blocking local app usage

#### Scenario: Resume after access-token expiry
- **WHEN** the computer resumes after the access token expired during sleep
- **THEN** Electron renews and persists the session before requesting a full reconciliation sync

#### Scenario: Logout
- **WHEN** user triggers logout
- **THEN** Electron cancels renewal work, deletes `{userData}/auth.dat`, calls `DELETE /api/v1/auth/session`, emits `auth:changed`, and app shows unauthenticated state

## ADDED Requirements

### Requirement: Runtime authentication state propagation
Terminal authentication changes SHALL propagate from the Electron main process to every renderer window. The React auth store SHALL re-read backend auth status after `auth:changed` and SHALL not continue to present an authenticated sync state after the backend session becomes unauthenticated.

#### Scenario: Scheduled renewal succeeds
- **WHEN** Electron completes a scheduled session renewal
- **THEN** it emits `auth:changed` and renderers rehydrate the authenticated identity without prompting the user

#### Scenario: Runtime session becomes invalid
- **WHEN** session renewal proves the refresh token is invalid or revoked
- **THEN** Electron emits `auth:changed` and every renderer changes to the unauthenticated login state

#### Scenario: Renderer window is hidden
- **WHEN** an auth transition occurs while a renderer window is hidden or minimized
- **THEN** Electron main still processes the transition and the renderer reflects the authoritative state when active
