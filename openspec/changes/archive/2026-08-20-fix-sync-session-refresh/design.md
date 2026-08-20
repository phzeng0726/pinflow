## Context

PinFlow splits authentication across three processes. Electron owns the encrypted refresh-token file, the Go backend owns the in-memory Supabase session used by cloud sync, and the React renderer displays the current auth and sync states. Today the Go REST client refreshes an expired access token internally and replaces the in-memory refresh token, but Electron is not informed of that rotation. After several rotations, `auth.dat` can contain an obsolete token, so a later application restart can fail to restore the session. A failed backend refresh also clears in-memory auth without notifying Electron or the renderer.

The reconciliation ticker already runs in the Go process every three minutes and is independent of renderer visibility. Windows sleep suspends all processes, so correctness requires explicit recovery after resume rather than synchronization during sleep.

## Goals / Non-Goals

**Goals:**

- Keep exactly one durable owner of the refresh token: the Electron main process using `safeStorage`.
- Renew the Supabase session before access-token expiry and persist every rotated refresh token before it can be used again.
- Restore authentication and trigger reconciliation after system resume without depending on renderer timers.
- Propagate terminal authentication failure to the renderer so UI state matches the backend.
- Preserve the existing three-minute reconciliation and 500 ms debounced push behavior.

**Non-Goals:**

- Synchronizing while the operating system is asleep.
- Changing Supabase schema, RLS policies, or workspace file formats.
- Making authentication mandatory for local/offline features.
- Replacing the existing OAuth provider or introducing a new auth SDK.

## Decisions

### Electron main process coordinates session renewal

Electron main SHALL schedule renewal from the access-token expiry returned by `POST /api/v1/auth/session`. Shortly before expiry, it SHALL decrypt the currently persisted refresh token, call the same endpoint with an empty access token, atomically persist the returned rotated refresh token, and reschedule using the new expiry.

This keeps `safeStorage` access in Electron and avoids renderer timer throttling. The alternative of letting the backend write `auth.dat` was rejected because Go cannot use Electron `safeStorage`. Returning refresh tokens through normal renderer-facing polling endpoints was rejected because it unnecessarily exposes credentials to the renderer.

### Backend refresh is explicit rather than hidden inside sync requests

The auth session endpoint SHALL remain the only code path that exchanges a refresh token. The Supabase REST client SHALL retry requests only after an explicitly renewed backend session; it SHALL NOT silently rotate credentials that Electron cannot persist. A 401 from a cloud request SHALL mark the backend session as requiring renewal and leave local data usable.

Electron's scheduled renewal normally prevents this state. For clock skew, revocation, or resume races, Electron SHALL also maintain a lightweight main-process auth monitor and attempt one immediate renewal when the backend reports that renewal is required. This centralizes rotation and prevents concurrent use of the same one-time refresh token.

### Session responses include expiry metadata

Successful `POST /api/v1/auth/session` responses SHALL include the rotated `refreshToken` and `expiresAt`. Refresh responses already return a new refresh token; access-token validation SHALL derive expiry from the JWT `exp` claim. The backend in-memory auth state SHALL track expiry and a renewal-required state without exposing the refresh token through `GET /api/v1/auth/session`.

### Resume recovery is owned by Electron

Electron SHALL listen to `powerMonitor` resume. On resume it SHALL renew the session when it is expired or close to expiry, then trigger a full sync when sync is enabled. Transient network failures SHALL preserve `auth.dat` and retry with bounded backoff. A Supabase response proving the refresh token is invalid or revoked SHALL remove `auth.dat`, clear the backend session, and emit `auth:changed`.

### Renderer state follows authoritative backend state

Electron SHALL send `auth:changed` after successful renewal and terminal auth failure. The existing root listener SHALL re-run `authStore.checkStatus()`. Sync status polling MAY also detect a renewal-required state, but it SHALL never carry or persist refresh tokens.

## Risks / Trade-offs

- [Timer fires late because the computer sleeps] → Handle `powerMonitor.resume`, renew first, then trigger reconciliation.
- [Network is unavailable at scheduled renewal] → Preserve encrypted credentials, use bounded retry, and keep local features available.
- [Refresh and logout race] → Serialize auth operations in Electron and cancel renewal timers before deleting `auth.dat`.
- [Clock skew causes an early 401] → Use an expiry safety margin and the backend renewal-required fallback path.
- [Existing installations contain an older but still valid token] → The first successful launch refresh rotates and immediately rewrites `auth.dat`; invalid tokens follow the existing logged-out path.
- [Development mode has no Electron-managed lifecycle] → Keep backend auth APIs deterministic and cover the desktop persistence behavior with isolated Electron-main helpers/tests.

## Migration Plan

1. Extend backend auth state and session responses with expiry/renewal metadata while retaining existing response fields.
2. Move automatic token exchange out of the generic Supabase REST request path and add typed renewal-required handling.
3. Add Electron renewal scheduling, atomic credential persistence, resume handling, and auth-state notification.
4. Update frontend auth/sync state handling and localized status text only if a new visible state is introduced.
5. Add regression tests before enabling the new lifecycle in release builds.

Rollback consists of reverting the application release; no workspace or cloud schema migration is involved. Existing `auth.dat` remains a single encrypted refresh token and is compatible with the previous release.

## Open Questions

- The exact renewal safety margin should be selected during implementation based on the returned JWT lifetime; one minute is the initial default.
- Electron main lifecycle helpers may require extraction from `main.js` to make timer, resume, and persistence behavior testable without starting a full application instance.
