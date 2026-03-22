## ADDED Requirements

### Requirement: Global tag creation
The system SHALL allow users to create named tags globally (not board-scoped). Tag names MUST be unique (case-insensitive). If a tag with the same name already exists the system SHALL return the existing tag instead of creating a duplicate.

#### Scenario: Create new tag
- **WHEN** user submits POST /api/tags with `{"name": "urgent"}`
- **THEN** system creates tag and returns `{id, name}` with HTTP 201

#### Scenario: Duplicate tag name
- **WHEN** user submits POST /api/tags with a name that already exists
- **THEN** system returns the existing tag with HTTP 200

### Requirement: Attach tag to card
The system SHALL allow attaching one or more tags to a card via POST /api/cards/:id/tags.

#### Scenario: Attach existing tag
- **WHEN** user posts `{"tag_id": 5}` to /api/cards/1/tags
- **THEN** system creates the card-tag association and returns updated tag list with HTTP 200

#### Scenario: Attach already-associated tag
- **WHEN** the tag is already associated with the card
- **THEN** system returns HTTP 200 without duplicating the association

### Requirement: Detach tag from card
The system SHALL allow removing a tag association from a card via DELETE /api/cards/:id/tags/:tagId without deleting the global tag.

#### Scenario: Detach tag
- **WHEN** user sends DELETE /api/cards/1/tags/5
- **THEN** system removes the association and returns HTTP 204; the global tag record is not deleted

### Requirement: List tags on card
The system SHALL return the card's associated tags in the card response DTO.

#### Scenario: Card response includes tags
- **WHEN** user fetches GET /api/cards/:id
- **THEN** response includes `"tags": [{id, name}, ...]`

### Requirement: List all global tags
The system SHALL expose GET /api/tags returning all tags for use in tag pickers.

#### Scenario: List tags
- **WHEN** user sends GET /api/tags
- **THEN** system returns array of all tags ordered by name
