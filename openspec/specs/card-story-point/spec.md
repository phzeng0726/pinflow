## Requirements

### Requirement: Card story point field
The system SHALL support an optional `story_point` field on Card. The value MUST be a positive integer or null (unset). The field SHALL be included in all Card response DTOs.

#### Scenario: Create card without story point
- **WHEN** user creates a card without specifying `story_point`
- **THEN** the card is created with `story_point: null`

#### Scenario: Update card with story point
- **WHEN** user sends PATCH /api/cards/:id with `{"story_point": 5}`
- **THEN** system updates the card's story point and returns the updated card with `"story_point": 5`

#### Scenario: Clear story point
- **WHEN** user sends PATCH /api/cards/:id with `{"story_point": null}`
- **THEN** system clears the story point and returns the updated card with `"story_point": null`

#### Scenario: Invalid story point value
- **WHEN** user sends PATCH /api/cards/:id with `{"story_point": -1}` or a non-integer value
- **THEN** system returns HTTP 400 with validation error

### Requirement: Story point button UI
The frontend SHALL display a set of predefined story point buttons (1, 3, 5, 7, 9, 11, 13, 15, 17, 19) in the CardDetailDialog. The currently selected value SHALL be visually highlighted. A clear button SHALL allow removing the story point.

#### Scenario: Select story point via button
- **WHEN** user clicks the "5" story point button
- **THEN** system sends PATCH to update story_point to 5 and highlights the "5" button

#### Scenario: Clear story point via button
- **WHEN** user clicks the clear/reset button
- **THEN** system sends PATCH to set story_point to null and no button is highlighted

#### Scenario: Display current story point
- **WHEN** card has story_point = 7
- **THEN** the "7" button is visually highlighted in the story point selector

### Requirement: Story point display on card item
The frontend SHALL display the story point value (if set) on the CardItem component in the Kanban board.

#### Scenario: Card with story point in board view
- **WHEN** a card has story_point = 3
- **THEN** the card item shows "3" as a badge/label

#### Scenario: Card without story point in board view
- **WHEN** a card has story_point = null
- **THEN** no story point indicator is shown on the card item
