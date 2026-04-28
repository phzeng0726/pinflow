## ADDED Requirements

### Requirement: Cross-board dependency creation is rejected
The system SHALL reject any attempt to create a dependency between cards that belong to different boards.

#### Scenario: Cross-board dependency rejected
- **WHEN** client sends POST /api/v1/cards/:id/dependencies where the source card and target card belong to different boards
- **THEN** system returns HTTP 422 with an error indicating cross-board dependencies are not allowed

## MODIFIED Requirements

### Requirement: Create dependency endpoint
The system SHALL provide `POST /api/v1/cards/:id/dependencies` to create a dependency from card `:id` to another card, with a specified canonical type. Both cards MUST belong to the same board.

#### Scenario: Successful creation
- **WHEN** client sends POST /api/v1/cards/1/dependencies with `{"toCardId": 2, "type": "blocks"}` and both cards are in the same board
- **THEN** system creates dependency and returns `DependencyResponse` with HTTP 201, including resolved `fromCard` and `toCard` metadata (title, boardId, boardName, columnId, columnName)

#### Scenario: Source card not found
- **WHEN** client sends POST with a non-existent `:id`
- **THEN** system returns HTTP 404

#### Scenario: Target card not found
- **WHEN** client sends POST with a non-existent `toCardId`
- **THEN** system returns HTTP 404

#### Scenario: Cross-board dependency rejected
- **WHEN** client sends POST where source and target cards are in different boards
- **THEN** system returns HTTP 422

### Requirement: Board-scoped card search endpoint
The system SHALL provide `GET /api/v1/cards/search?q=<query>&limit=<n>&board_id=<id>` to search cards by title. The `board_id` parameter is optional; when provided, results MUST be restricted to that board only. When omitted, all boards are searched (for backward compatibility).

#### Scenario: Title match within board when board_id provided
- **WHEN** client sends GET /api/v1/cards/search?q=frontend&board_id=1
- **THEN** response returns only cards in board 1 whose title contains "frontend" (case-insensitive)

#### Scenario: Title match across all boards when board_id omitted
- **WHEN** client sends GET /api/v1/cards/search?q=frontend (no board_id)
- **THEN** response returns cards from all boards whose title matches (original behavior)

#### Scenario: Empty query
- **WHEN** client sends GET /api/v1/cards/search?q=
- **THEN** system returns HTTP 400

#### Scenario: No matches
- **WHEN** query matches no cards
- **THEN** response returns empty array with HTTP 200

### Requirement: Two-step dependency popover UI
The system SHALL provide a popover in CardDetailDialog that guides users through dependency creation in two steps: (1) select relation type, (2) search and select target card within the current board only.

#### Scenario: Step 1 — select relation type
- **WHEN** user opens the dependency popover
- **THEN** popover shows 6 relation options (Blocks, Is blocked by, Is parent to, Is child to, Duplicates, Is related to), each with a label and description

#### Scenario: Step 2 — search target card within current board
- **WHEN** user selects a relation type
- **THEN** popover transitions to card search view with a back button, search input, and results list showing only cards from the current board

#### Scenario: Cards from other boards are not shown in search results
- **WHEN** user searches for a card title that exists in multiple boards
- **THEN** only cards from the current board appear in the results list

#### Scenario: Preview bar shows relation
- **WHEN** user has selected both a relation type and a target card
- **THEN** a preview bar at the bottom of the popover displays the relation in natural language: "{thisCard.title} → {relationLabel} → {targetCard.title}"

#### Scenario: Confirm creates dependency
- **WHEN** user clicks confirm with a relation type and target card selected
- **THEN** system creates the dependency using canonical type and correct direction (flip if needed), popover closes, and dependency appears in the list

#### Scenario: Cancel discards selection
- **WHEN** user clicks cancel
- **THEN** no dependency is created and popover closes
