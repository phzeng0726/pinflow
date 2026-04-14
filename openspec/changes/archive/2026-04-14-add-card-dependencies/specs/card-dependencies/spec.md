## ADDED Requirements

### Requirement: Dependency data model supports 4 canonical types
The system SHALL store card dependencies as directed edges with 4 canonical types: `blocks`, `parent_of`, `duplicates`, `related_to`. Each dependency SHALL have a unique ID, `fromCardId`, `toCardId`, `type`, and `createdAt`.

#### Scenario: Valid dependency types accepted
- **WHEN** client sends POST /api/v1/cards/:id/dependencies with type `blocks`, `parent_of`, `duplicates`, or `related_to`
- **THEN** system creates and persists the dependency

#### Scenario: Invalid type rejected
- **WHEN** client sends POST /api/v1/cards/:id/dependencies with an unknown type
- **THEN** system returns HTTP 400

### Requirement: Self-referential dependencies are rejected
The system SHALL reject any attempt to create a dependency where `fromCardId` equals `toCardId`.

#### Scenario: Self-reference attempt
- **WHEN** client sends POST /api/v1/cards/:id/dependencies with `toCardId` equal to `:id`
- **THEN** system returns HTTP 400 with error message

### Requirement: Duplicate dependencies are rejected
The system SHALL reject creating a dependency if an identical edge (same from, to, type) already exists. For `related_to` type, the system SHALL also check the reverse direction (from=to, to=from) as it is symmetric.

#### Scenario: Exact duplicate rejected
- **WHEN** client creates the same dependency (fromCardId, toCardId, type) twice
- **THEN** second request returns HTTP 409

#### Scenario: Symmetric related_to duplicate rejected
- **WHEN** dependency (A, B, related_to) exists and client creates (B, A, related_to)
- **THEN** system returns HTTP 409

### Requirement: Create dependency endpoint
The system SHALL provide `POST /api/v1/cards/:id/dependencies` to create a dependency from card `:id` to another card, with a specified canonical type.

#### Scenario: Successful creation
- **WHEN** client sends POST /api/v1/cards/1/dependencies with `{"toCardId": 2, "type": "blocks"}`
- **THEN** system creates dependency and returns `DependencyResponse` with HTTP 201, including resolved `fromCard` and `toCard` metadata (title, boardId, boardName, columnId, columnName)

#### Scenario: Source card not found
- **WHEN** client sends POST with a non-existent `:id`
- **THEN** system returns HTTP 404

#### Scenario: Target card not found
- **WHEN** client sends POST with a non-existent `toCardId`
- **THEN** system returns HTTP 404

### Requirement: List dependencies endpoint
The system SHALL provide `GET /api/v1/cards/:id/dependencies` to list all dependencies involving card `:id`, regardless of direction.

#### Scenario: Returns both directions
- **WHEN** dependency (A blocks B) exists and client fetches GET /api/v1/cards/B/dependencies
- **THEN** response includes the dependency with fromCardId=A, toCardId=B

#### Scenario: Empty list
- **WHEN** card has no dependencies
- **THEN** response returns empty array with HTTP 200

### Requirement: Delete dependency endpoint
The system SHALL provide `DELETE /api/v1/dependencies/:id` to remove a dependency by its ID.

#### Scenario: Successful deletion
- **WHEN** client sends DELETE /api/v1/dependencies/1
- **THEN** dependency is removed and both cards no longer show it in their dependency list

#### Scenario: Dependency not found
- **WHEN** client sends DELETE with a non-existent dependency ID
- **THEN** system returns HTTP 404

### Requirement: Card deletion cascades to dependencies
The system SHALL remove all dependencies involving a card when that card is deleted.

#### Scenario: Delete card removes its dependencies
- **WHEN** card A is deleted and had dependencies (A blocks B) and (C is parent to A)
- **THEN** both dependencies are removed; card B and C no longer show them

### Requirement: Cross-board card search endpoint
The system SHALL provide `GET /api/v1/cards/search?q=<query>&limit=<n>` to search cards by title across all boards, returning up to `limit` results (default 20).

#### Scenario: Title match across boards
- **WHEN** client sends GET /api/v1/cards/search?q=frontend
- **THEN** response returns all cards whose title contains "frontend" (case-insensitive), each with id, title, boardId, boardName, columnId, columnName

#### Scenario: Empty query
- **WHEN** client sends GET /api/v1/cards/search?q=
- **THEN** system returns HTTP 400

#### Scenario: No matches
- **WHEN** query matches no cards
- **THEN** response returns empty array with HTTP 200

### Requirement: Two-step dependency popover UI
The system SHALL provide a popover in CardDetailDialog that guides users through dependency creation in two steps: (1) select relation type, (2) search and select target card.

#### Scenario: Step 1 — select relation type
- **WHEN** user opens the dependency popover
- **THEN** popover shows 6 relation options (Blocks, Is blocked by, Is parent to, Is child to, Duplicates, Is related to), each with a label and description

#### Scenario: Step 2 — search target card
- **WHEN** user selects a relation type
- **THEN** popover transitions to card search view with a back button, search input, and results list showing card title and board/column context

#### Scenario: Preview bar shows relation
- **WHEN** user has selected both a relation type and a target card
- **THEN** a preview bar at the bottom of the popover displays the relation in natural language: "{thisCard.title} → {relationLabel} → {targetCard.title}"

#### Scenario: Confirm creates dependency
- **WHEN** user clicks confirm with a relation type and target card selected
- **THEN** system creates the dependency using canonical type and correct direction (flip if needed), popover closes, and dependency appears in the list

#### Scenario: Cancel discards selection
- **WHEN** user clicks cancel
- **THEN** no dependency is created and popover closes

### Requirement: CardItem displays dependency count
The system SHALL display a link icon and dependency count in the card meta row on the board view when a card has one or more dependencies.

#### Scenario: Card with dependencies shows count
- **WHEN** a card has 2 dependencies
- **THEN** board view card shows a link icon and "2" in the meta row

#### Scenario: Card with no dependencies shows nothing
- **WHEN** a card has 0 dependencies
- **THEN** no dependency indicator is shown on the board card
