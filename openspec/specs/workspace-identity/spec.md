## Purpose

Defines requirements for workspace identity — the persistent UUID (`workspaceId`) assigned to each workspace, and how it is used by backend services (e.g., as `authorId` for comments).

## Requirements

### Requirement: Workspace has a unique persistent identity

The system SHALL generate a UUID (`workspaceId`) the first time a workspace is created or opened and persist it in `manifest.json`. On subsequent opens, the existing `workspaceId` SHALL be loaded as-is without regeneration.

#### Scenario: First workspace open generates workspaceId

- **WHEN** a workspace is opened and `manifest.json` does not contain a `workspaceId`
- **THEN** a new UUID is generated, written to `manifest.json`, and held in memory for the session

#### Scenario: Existing workspaceId is preserved

- **WHEN** a workspace is opened and `manifest.json` already contains a `workspaceId`
- **THEN** the existing value is loaded and no new UUID is generated

### Requirement: workspaceId is accessible to backend services

The FileStore SHALL expose the current `workspaceId` via a method (e.g., `WorkspaceID() string`) so that service and handler layers can attach it to new records without requiring the client to send it.

#### Scenario: WorkspaceID available after store init

- **WHEN** `store.New()` completes successfully
- **THEN** `store.WorkspaceID()` returns a non-empty UUID string

### Requirement: Comments record authorId from workspaceId

When a comment is created, the backend SHALL automatically set the comment's `authorId` field to the current `workspaceId`. The client request body SHALL NOT include `authorId`.

#### Scenario: New comment has authorId set

- **WHEN** POST /api/v1/cards/:id/comments is called
- **THEN** the stored comment has `authorId` equal to the workspace's `workspaceId`
