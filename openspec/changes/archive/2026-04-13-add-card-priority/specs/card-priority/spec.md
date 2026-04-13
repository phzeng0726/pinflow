## ADDED Requirements

### Requirement: Card priority field

The system SHALL support an optional `priority` field on Card. The value MUST be an integer between 1 and 5 (inclusive), or null (unset). The field SHALL be included in all Card response DTOs.

Priority levels:
- 1 = Highest
- 2 = Critical
- 3 = High
- 4 = Medium
- 5 = Low

#### Scenario: Create card without priority

- **WHEN** user creates a card without specifying `priority`
- **THEN** the card is created with `priority: null`

#### Scenario: Update card with priority

- **WHEN** user sends PATCH /api/v1/cards/:id with `{"priority": 3}`
- **THEN** system updates the card's priority and returns the updated card with `"priority": 3`

#### Scenario: Clear priority via null

- **WHEN** user sends PATCH /api/v1/cards/:id with `{"priority": null}`
- **THEN** system clears the priority and returns the updated card with `"priority": null`

#### Scenario: Clear priority via zero

- **WHEN** user sends PATCH /api/v1/cards/:id with `{"priority": 0}`
- **THEN** system clears the priority and returns the updated card with `"priority": null`

#### Scenario: Invalid priority value out of range

- **WHEN** user sends PATCH /api/v1/cards/:id with `{"priority": 6}` or `{"priority": -1}`
- **THEN** system returns HTTP 400 with a validation error

### Requirement: Priority trigger button

The system SHALL display a single button that triggers the Priority popover. When a priority is assigned, the button SHALL display the level abbreviation (P1–P5) with a filled style. When no priority is assigned, the button SHALL display a `+` icon with an outline style.

#### Scenario: Button shows current priority abbreviation

- **WHEN** the card has `priority = 2`
- **THEN** the trigger button shows "P2" with filled style

#### Scenario: Button shows add icon when no priority

- **WHEN** the card has no priority (`priority` is null)
- **THEN** the trigger button shows a `+` icon with outline style

### Requirement: Priority popover content

The system SHALL display a popover containing a vertical list of five priority options (Highest / Critical / High / Medium / Low), a header "Priority", and a REMOVE button at the bottom.

#### Scenario: Popover opens on trigger click

- **WHEN** user clicks the Priority trigger button
- **THEN** a popover opens containing the five priority options

#### Scenario: Currently selected priority is highlighted

- **WHEN** the popover is open and the card has `priority = 3`
- **THEN** the "High" option is rendered with the selected (filled) style

#### Scenario: REMOVE button visibility

- **WHEN** the popover is open and the card has a priority assigned
- **THEN** a REMOVE button is visible at the bottom of the popover

#### Scenario: REMOVE button hidden when no priority

- **WHEN** the popover is open and the card has no priority
- **THEN** the REMOVE button is not rendered

### Requirement: Selecting a priority value updates the card and closes the popover

The system SHALL call `updateCard` with the selected priority value when an option is clicked, then close the popover.

#### Scenario: User selects a new priority

- **WHEN** user clicks "High" (priority 3) in the popover
- **THEN** `updateCard` is called with `priority: 3` and the popover closes

#### Scenario: User clicks the already-selected priority

- **WHEN** user clicks the option that matches the current `card.priority`
- **THEN** `updateCard` is called with `priority: 0` (clear) and the popover closes

### Requirement: REMOVE clears the priority and closes the popover

The system SHALL call `updateCard` with `priority: 0` when REMOVE is clicked, then close the popover.

#### Scenario: User clicks REMOVE

- **WHEN** user clicks the REMOVE button in the popover
- **THEN** `updateCard` is called with `priority: 0` and the popover closes
