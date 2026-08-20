## MODIFIED Requirements

### Requirement: Cloud timestamp query
The sync client SHALL support querying the latest `updated_at` timestamp across syncable workspace files for the authenticated user via a single PostgREST request. Rows whose path contains a `.snapshots` directory segment SHALL be excluded. When no syncable workspace files exist, the method SHALL return nil.

#### Scenario: Cloud has syncable files
- **WHEN** the authenticated user has non-snapshot workspace files in Supabase
- **THEN** `GetLatestUpdatedAt()` returns the most recent `updated_at` value across non-snapshot rows

#### Scenario: Cloud has only snapshot rows
- **WHEN** the authenticated user has only paths under `.snapshots` directories in Supabase
- **THEN** `GetLatestUpdatedAt()` returns nil without error

#### Scenario: Cloud is empty
- **WHEN** the authenticated user has no workspace files in Supabase
- **THEN** `GetLatestUpdatedAt()` returns nil without error

#### Scenario: Network error during query
- **WHEN** the Supabase API is unreachable
- **THEN** `GetLatestUpdatedAt()` returns an error and the caller degrades gracefully
