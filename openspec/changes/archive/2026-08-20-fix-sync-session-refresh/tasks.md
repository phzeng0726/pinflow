## 1. Backend Session Lifecycle

- [x] 1.1 Extend `AuthState` and auth session DTO responses with access-token expiry and renewal-required metadata while keeping refresh tokens out of `GET /api/v1/auth/session`.
- [x] 1.2 Parse access-token expiry during validation and return the latest rotated refresh token plus `expiresAt` from successful `POST /api/v1/auth/session` calls.
- [x] 1.3 Replace hidden refresh-and-retry behavior in the Supabase REST client with a typed renewal-required error on 401 and update sync status handling without discarding pending local changes.
- [x] 1.4 Add backend tests for expiry metadata, explicit refresh rotation, 401 renewal-required behavior, and successful sync after a renewed session.

## 2. Electron Session Coordination

- [x] 2.1 Extract testable Electron main-process helpers for serialized auth operations, atomic `auth.dat` replacement, timer cancellation, and authentication-error classification.
- [x] 2.2 Implement pre-expiry session renewal in Electron main using the persisted refresh token, then atomically save every rotated token and schedule the next expiry.
- [x] 2.3 Add bounded retry for transient renewal failures while preserving `auth.dat`, and clear credentials/backend auth only for terminal invalid or revoked token responses.
- [x] 2.4 Register `powerMonitor` resume recovery to renew an expired or near-expiry session before calling the existing full-sync trigger.
- [x] 2.5 Ensure login, restart restoration, successful renewal, terminal failure, and logout consistently cancel or reschedule auth work and emit `auth:changed` to all renderer windows.

## 3. Renderer State Consistency

- [x] 3.1 Update frontend auth/session types and Zustand hydration so `auth:changed` always replaces stale authenticated state with the authoritative backend result.
- [x] 3.2 Update sync status handling and both locale files if renewal-required or retry information is visible to the user, without exposing refresh-token data to the renderer.
- [x] 3.3 Add frontend regression tests covering runtime authentication loss and rehydration after Electron auth notifications.

## 4. Lifecycle Verification

- [x] 4.1 Add an Electron main-process test harness and tests for token rotation persistence, serialized renewal/logout races, transient retry, and resume ordering.
- [x] 4.2 Run backend tests, frontend tests, frontend lint/build, and Electron packaging or startup smoke checks; resolve all failures introduced by this change.
- [x] 4.3 Manually verify that minimized/tray operation continues three-minute reconciliation, sleep performs no sync, resume renews before reconciling, and restarting after multiple token rotations remains signed in.
