## ADDED Requirements

### Requirement: Tag color field
The system SHALL support an optional `color` field on Tag. The value MUST be a predefined color key string (e.g., `"red"`, `"blue"`, `"green"`) or empty string (no color). The field SHALL be included in all Tag response DTOs.

#### Scenario: Create tag with color
- **WHEN** user sends POST /api/tags with `{"name": "urgent", "color": "red"}`
- **THEN** system creates tag and returns `{id, name, color}` with HTTP 201

#### Scenario: Create tag without color
- **WHEN** user sends POST /api/tags with `{"name": "review"}` (no color field)
- **THEN** system creates tag with `color: ""` and returns `{id, name, color}`

### Requirement: Update tag
The system SHALL allow updating a tag's name and/or color via PATCH /api/v1/tags/:id.

#### Scenario: Update tag name
- **WHEN** user sends PATCH /api/tags/1 with `{"name": "critical"}`
- **THEN** system updates the tag name and returns the updated tag

#### Scenario: Update tag color
- **WHEN** user sends PATCH /api/tags/1 with `{"color": "blue"}`
- **THEN** system updates the tag color and returns the updated tag

#### Scenario: Update tag with duplicate name
- **WHEN** user sends PATCH /api/tags/1 with a name that already exists on another tag
- **THEN** system returns HTTP 409 conflict error

#### Scenario: Update non-existent tag
- **WHEN** user sends PATCH /api/tags/999
- **THEN** system returns HTTP 404

### Requirement: Delete tag
The system SHALL allow deleting a global tag via DELETE /api/v1/tags/:id. Deleting a tag MUST remove all card-tag associations (CASCADE).

#### Scenario: Delete tag
- **WHEN** user sends DELETE /api/tags/1
- **THEN** system deletes the tag and all card-tag associations; returns HTTP 204

#### Scenario: Delete non-existent tag
- **WHEN** user sends DELETE /api/tags/999
- **THEN** system returns HTTP 404

### Requirement: Color picker in tag creation/editing UI
The frontend SHALL display a color palette with predefined Tailwind color options when creating or editing a tag. Colors SHALL include: red, orange, amber, yellow, lime, green, emerald, cyan, blue, violet, purple, pink.

#### Scenario: Select color when creating tag
- **WHEN** user creates a new tag and selects a color from the palette
- **THEN** the tag is created with the selected color

#### Scenario: Change color when editing tag
- **WHEN** user edits a tag and selects a different color
- **THEN** the tag color is updated and reflected everywhere the tag appears

### Requirement: Tag edit/delete UI
The frontend SHALL provide edit and delete actions for global tags. Delete action MUST show a confirmation dialog before proceeding.

#### Scenario: Edit tag from tag management
- **WHEN** user clicks edit on a tag
- **THEN** an edit form appears with current name and color, allowing modification

#### Scenario: Delete tag with confirmation
- **WHEN** user clicks delete on a tag
- **THEN** a confirmation dialog appears; on confirm, the tag is deleted

## MODIFIED Requirements

### Requirement: Global tag creation
The system SHALL allow users to create named tags globally (not board-scoped). Tag names MUST be unique (case-insensitive). If a tag with the same name already exists the system SHALL return the existing tag instead of creating a duplicate. The create request MAY include a `color` field.

#### Scenario: Create new tag
- **WHEN** user submits POST /api/tags with `{"name": "urgent", "color": "red"}`
- **THEN** system creates tag and returns `{id, name, color}` with HTTP 201

#### Scenario: Duplicate tag name
- **WHEN** user submits POST /api/tags with a name that already exists
- **THEN** system returns the existing tag with HTTP 200

### Requirement: List tags on card
The system SHALL return the card's associated tags (including color) in the card response DTO.

#### Scenario: Card response includes tags
- **WHEN** user fetches GET /api/cards/:id
- **THEN** response includes `"tags": [{id, name, color}, ...]`

### Requirement: List all global tags
The system SHALL expose GET /api/tags returning all tags (including color) for use in tag pickers.

#### Scenario: List tags
- **WHEN** user sends GET /api/tags
- **THEN** system returns array of all tags with `{id, name, color}` ordered by name
