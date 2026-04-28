## REMOVED Requirements

### Requirement: Global tag creation
**Reason**: Tags 改為 board 範圍資源，不再有 workspace 全域 tag 的概念。`POST /api/v1/tags` 路由移除。
**Migration**: 改用 `POST /api/v1/boards/:id/tags`

### Requirement: List all global tags
**Reason**: 全域 tag 列表不再適用，改為 per-board 查詢。`GET /api/v1/tags` 路由移除。
**Migration**: 改用 `GET /api/v1/boards/:id/tags`

## ADDED Requirements

### Requirement: Board-scoped tag creation
The system SHALL allow creating tags scoped to a specific board via `POST /api/v1/boards/:id/tags`. Tag names MUST be unique within a board (case-insensitive). If a tag with the same name already exists in that board, the system SHALL return the existing tag. Tag names MAY be reused across different boards as independent entities with separate IDs. Each board's tags use a per-board ID counter starting at 1.

#### Scenario: Create new board-scoped tag
- **WHEN** user sends POST /api/v1/boards/1/tags with `{"name": "urgent", "color": "red"}`
- **THEN** system creates tag with a per-board ID and returns `{id, name, color, boardId}` with HTTP 201

#### Scenario: Duplicate tag name within same board
- **WHEN** user sends POST /api/v1/boards/1/tags with a name that already exists in board 1
- **THEN** system returns the existing tag with HTTP 200

#### Scenario: Same tag name in different boards is allowed
- **WHEN** board 1 has tag "Bug" and user sends POST /api/v1/boards/2/tags with `{"name": "Bug"}`
- **THEN** system creates a new independent tag with a different ID in board 2 and returns HTTP 201

#### Scenario: Board not found
- **WHEN** user sends POST /api/v1/boards/999/tags
- **THEN** system returns HTTP 404

### Requirement: Board-scoped tag list
The system SHALL expose `GET /api/v1/boards/:id/tags` returning all tags belonging to that board, ordered by name.

#### Scenario: List board tags
- **WHEN** user sends GET /api/v1/boards/1/tags
- **THEN** system returns array of tags `{id, name, color}` belonging to board 1, ordered by name

#### Scenario: Empty board
- **WHEN** board has no tags
- **THEN** response returns empty array with HTTP 200

#### Scenario: Board not found
- **WHEN** user sends GET /api/v1/boards/999/tags
- **THEN** system returns HTTP 404

### Requirement: Cross-board tag attach is rejected
The system SHALL reject any attempt to attach a tag to a card when the tag belongs to a different board than the card.

#### Scenario: Cross-board attach rejected
- **WHEN** user sends POST /api/v1/cards/:cardId/tags with a tag_id belonging to a different board
- **THEN** system returns HTTP 422 with an error indicating cross-board tag assignment is not allowed

## MODIFIED Requirements

### Requirement: Attach tag to card
The system SHALL allow attaching one or more tags to a card via POST /api/cards/:id/tags. The tag MUST belong to the same board as the card.

#### Scenario: Attach existing tag
- **WHEN** user posts `{"tag_id": 5}` to /api/cards/1/tags and tag 5 belongs to the same board as card 1
- **THEN** system creates the card-tag association and returns updated tag list with HTTP 200

#### Scenario: Attach already-associated tag
- **WHEN** the tag is already associated with the card
- **THEN** system returns HTTP 200 without duplicating the association

#### Scenario: Attach tag from different board
- **WHEN** user posts with a tag_id belonging to a different board than card 1
- **THEN** system returns HTTP 422

### Requirement: Tags popover list view
The system SHALL show a list view by default when the Tags popover is opened. The list view SHALL include a search input, a list of the **current board's** tags with checkboxes and edit buttons, and a "Create a new tag" button at the bottom. Only tags belonging to the card's board SHALL be shown.

#### Scenario: Popover opens on + button click
- **WHEN** user clicks the `+` trigger button
- **THEN** the popover opens showing the list view with title "Tags"

#### Scenario: Only current board tags are shown
- **WHEN** workspace has tags in multiple boards
- **THEN** the list view shows ONLY tags belonging to the current card's board

#### Scenario: Checkbox reflects attach state
- **WHEN** a tag is attached to the current card
- **THEN** its checkbox in the list view is checked

#### Scenario: Checking an unchecked tag attaches it
- **WHEN** user checks an unchecked tag checkbox
- **THEN** `attachTag` is called with that tag's id

#### Scenario: Unchecking a checked tag detaches it
- **WHEN** user unchecks a checked tag checkbox
- **THEN** `detachTag` is called with that tag's id

#### Scenario: Search filters the tag list
- **WHEN** user types in the search input
- **THEN** only tags whose name contains the search string (case-insensitive) are shown

#### Scenario: Edit button navigates to edit view
- **WHEN** user clicks the pencil icon next to a tag
- **THEN** the popover switches to the edit view for that tag

#### Scenario: Create button navigates to create view
- **WHEN** user clicks "Create a new tag"
- **THEN** the popover switches to the create view
