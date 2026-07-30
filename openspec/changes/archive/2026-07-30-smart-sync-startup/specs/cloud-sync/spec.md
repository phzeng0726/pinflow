## MODIFIED Requirements

### Requirement: Workspace source decision
Every newly established or restored authenticated session SHALL check whether the account already has cloud workspace data. The behavior SHALL differ based on whether the user has previously completed a source decision for this account:

**First-time decision** (`sourceDecisionMade` is false or `lastSyncedUserId` does not match current user):
- If the account has cloud data, the backend SHALL set the source state to pending and block uploads until the user chooses a source via the dialog.
- If the account has no cloud data, the backend SHALL skip the dialog, mark the decision as complete, and enable sync per user settings.

**Returning session** (`sourceDecisionMade` is true and `lastSyncedUserId` matches current user):
- The backend SHALL NOT set the source state to pending.
- The backend SHALL compare timestamps to auto-determine sync direction (see `sync-auto-decision` spec).

The sync API SHALL provide:
- `GET /api/v1/sync/source` returning whether cloud data exists, whether a decision is pending, and the current `autoAction` status
- `POST /api/v1/sync/source` accepting `{source: "cloud" | "local"}` and performing the selected replacement. After successful resolution, `sourceDecisionMade` SHALL be set to `true` and `lastSyncedAt` SHALL be updated.

#### Scenario: Login with existing cloud data
- **WHEN** an auth session is established, `sourceDecisionMade` is `false`, and the account has cloud workspace rows
- **THEN** the source state becomes pending and no local data is uploaded before the user chooses a source

#### Scenario: Login without cloud data
- **WHEN** an auth session is established, `sourceDecisionMade` is `false`, and the account has no cloud workspace rows
- **THEN** no source decision is required, `sourceDecisionMade` is set to `true`, and sync is enabled per settings

#### Scenario: Returning session with cloud data
- **WHEN** an auth session is restored, `sourceDecisionMade` is `true`, and `lastSyncedUserId` matches
- **THEN** no dialog is shown and the sync manager compares timestamps to auto-determine direction

#### Scenario: Account switch
- **WHEN** an auth session is established and `lastSyncedUserId` does not match the current user ID
- **THEN** the session is treated as a first-time decision regardless of `sourceDecisionMade`

#### Scenario: Decide later
- **WHEN** the user dismisses the workspace source dialog
- **THEN** neither local nor cloud data is modified, the source decision remains pending, and sync remains disabled

#### Scenario: Authentication changes
- **WHEN** the user logs out or signs in as a different user
- **THEN** any previous in-memory source decision is cleared and the new authenticated session is evaluated independently
