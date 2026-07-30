## MODIFIED Requirements

### Requirement: Electron OAuth flow
Electron main process SHALL provide an OAuth flow that opens the system browser for Google login via Supabase Auth.

The flow SHALL:
1. Start a temporary HTTP server on a local port (default 34116)
2. Open the system default browser to the Supabase OAuth URL with `redirect_to` pointing to the local server
3. Receive the auth callback with tokens
4. Encrypt the refresh token using `safeStorage.encryptString()` and save to `{userData}/auth.dat`
5. Send tokens to Go backend via `POST /api/v1/auth/session`
6. Close the temporary server
7. Notify the renderer process via IPC `auth:changed`

On app restart, `loadSavedAuth()` SHALL decrypt the saved refresh token, send it to the backend via `POST /api/v1/auth/session`, and restore the authenticated session. On failure, it SHALL distinguish between authentication errors (token expired/revoked) and transient errors (network unreachable, backend not ready). Authentication errors SHALL delete `auth.dat`. Transient errors SHALL preserve `auth.dat` for retry on next launch. All failures SHALL be logged via `electron-log`.

#### Scenario: First-time login
- **WHEN** user triggers login from the frontend
- **THEN** system browser opens Google login, user authenticates, tokens are stored, and app shows authenticated state

#### Scenario: App restart with saved token
- **WHEN** app starts and `{userData}/auth.dat` exists
- **THEN** Electron decrypts the saved refresh token, refreshes it via `POST /api/v1/auth/session`, and restores authenticated state automatically

#### Scenario: App restart with expired token
- **WHEN** app starts and the saved refresh token has expired
- **THEN** `loadSavedAuth()` logs the failure, deletes `auth.dat`, and the app shows unauthenticated state

#### Scenario: App restart with network error
- **WHEN** app starts and the backend or Supabase is temporarily unreachable
- **THEN** `loadSavedAuth()` logs the error, preserves `auth.dat`, and the app shows unauthenticated state for this session but can retry on next launch

#### Scenario: Logout
- **WHEN** user triggers logout
- **THEN** `{userData}/auth.dat` is deleted, `DELETE /api/v1/auth/session` is called, and app shows unauthenticated state
