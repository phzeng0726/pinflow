## ADDED Requirements

### Requirement: Backend auth session endpoints
The backend SHALL expose auth session management endpoints under `/api/v1/auth/`.

- `POST /api/v1/auth/session` SHALL accept `{accessToken, refreshToken}`, validate the access token against Supabase Auth API (`GET /auth/v1/user`), and store the auth state in memory. It SHALL return `{authenticated: true, userId, email}` on success, or a 401 error on invalid token.
- `GET /api/v1/auth/session` SHALL return the current auth status `{authenticated: bool, userId?, email?}`.
- `DELETE /api/v1/auth/session` SHALL clear the stored auth state and return 200.

#### Scenario: Successful session creation
- **WHEN** frontend sends `POST /api/v1/auth/session` with valid Supabase tokens
- **THEN** backend validates the access token with Supabase, stores auth state, and returns `{authenticated: true, userId, email}`

#### Scenario: Invalid token
- **WHEN** frontend sends `POST /api/v1/auth/session` with an invalid or expired access token
- **THEN** backend returns 401 with an error message

#### Scenario: Check auth status when not authenticated
- **WHEN** frontend sends `GET /api/v1/auth/session` and no session exists
- **THEN** backend returns `{authenticated: false}`

#### Scenario: Logout
- **WHEN** frontend sends `DELETE /api/v1/auth/session`
- **THEN** backend clears stored auth state and returns 200

### Requirement: Backend token refresh
The backend SHALL support refreshing expired access tokens using the stored refresh token.

When the access token is expired or a Supabase API call returns 401, the backend SHALL call Supabase `POST /auth/v1/token?grant_type=refresh_token` with the stored refresh token. If refresh succeeds, the new tokens SHALL replace the old ones. If refresh fails, the auth state SHALL be cleared.

#### Scenario: Automatic token refresh
- **WHEN** access token is expired and a valid refresh token exists
- **THEN** backend refreshes the token automatically and retries the failed request

#### Scenario: Refresh token expired
- **WHEN** both access token and refresh token are expired
- **THEN** backend clears auth state and subsequent `GET /api/v1/auth/session` returns `{authenticated: false}`

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

#### Scenario: First-time login
- **WHEN** user triggers login from the frontend
- **THEN** system browser opens Google login, user authenticates, tokens are stored, and app shows authenticated state

#### Scenario: App restart with saved token
- **WHEN** app starts and `{userData}/auth.dat` exists
- **THEN** Electron decrypts the saved refresh token, refreshes it via `POST /api/v1/auth/session`, and restores authenticated state automatically

#### Scenario: Logout
- **WHEN** user triggers logout
- **THEN** `{userData}/auth.dat` is deleted, `DELETE /api/v1/auth/session` is called, and app shows unauthenticated state

### Requirement: Electron auth IPC
The preload script SHALL expose auth-related IPC methods via `window.electronAPI`:

- `startAuth()` — triggers OAuth flow, returns a promise that resolves when complete
- `getAuthStatus()` — returns current auth state from backend
- `logout()` — triggers logout flow
- `onAuthChanged(callback)` — listens for auth state changes

#### Scenario: Preload API available
- **WHEN** app runs in Electron
- **THEN** `window.electronAPI.startAuth`, `getAuthStatus`, `logout`, and `onAuthChanged` are available

### Requirement: Frontend auth store
A Zustand store SHALL manage auth state with: `isAuthenticated`, `userId`, `email`, `isLoading`.

The store SHALL provide:
- `login()` — calls `window.electronAPI.startAuth()` in Electron mode
- `logout()` — calls `window.electronAPI.logout()` and clears state
- `checkStatus()` — calls `GET /api/v1/auth/session` and hydrates state

#### Scenario: Auth state hydration on boot
- **WHEN** app starts
- **THEN** root route calls `authStore.checkStatus()` to load current auth state from backend

#### Scenario: Login from frontend
- **WHEN** user clicks login button in SyncStatusIndicator
- **THEN** `authStore.login()` triggers Electron OAuth flow and updates state on completion

### Requirement: User-facing logout action
The authenticated sync dropdown in the app header SHALL display the current account email and provide a localized logout action.

#### Scenario: Logout from sync dropdown
- **WHEN** an authenticated user selects "Logout" from the sync dropdown
- **THEN** the frontend calls `authStore.logout()`, Electron deletes `{userData}/auth.dat`, the backend auth session is cleared, and the header immediately returns to the unauthenticated login state

#### Scenario: Logout does not remove local data
- **WHEN** the user logs out
- **THEN** local workspace data remains available and all non-cloud app functionality continues to work

### Requirement: Auth is optional
Auth SHALL NOT block any existing app functionality. The app SHALL work 100% offline without authentication. Auth is only required for cloud sync features.

#### Scenario: App usage without login
- **WHEN** user opens app and does not log in
- **THEN** all board, card, column, tag, checklist, comment, dependency, and snapshot operations work normally

#### Scenario: No auth guard on routes
- **WHEN** user navigates to any route without being authenticated
- **THEN** the route loads normally without redirect or blocking
