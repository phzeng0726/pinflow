## ADDED Requirements

### Requirement: SP trigger button reflects current value
The system SHALL display a single button that triggers the SP popover. When a story point is assigned, the button SHALL display the numeric value with a blue filled style. When no story point is assigned, the button SHALL display a `+` icon with an outline style.

#### Scenario: Button shows current SP value
- **WHEN** the card has `storyPoint = 5`
- **THEN** the trigger button shows "5" with blue background

#### Scenario: Button shows add icon when no SP
- **WHEN** the card has no story point (`storyPoint` is null or 0)
- **THEN** the trigger button shows a `+` icon with outline style

### Requirement: SP popover content
The system SHALL display a popover containing a grid of selectable SP values `[1, 3, 5, 7, 9, 11, 13, 15, 17, 19]`, a header "Story Points", and a REMOVE button.

#### Scenario: Popover opens on trigger click
- **WHEN** user clicks the SP trigger button
- **THEN** a popover opens containing the SP number grid

#### Scenario: Currently selected SP is highlighted
- **WHEN** the popover is open and the card has `storyPoint = 3`
- **THEN** the "3" button is rendered with the selected (blue filled) style

#### Scenario: REMOVE button visibility
- **WHEN** the popover is open and the card has a story point assigned
- **THEN** a REMOVE button is visible at the bottom of the popover

#### Scenario: REMOVE button hidden when no SP
- **WHEN** the popover is open and the card has no story point
- **THEN** the REMOVE button is not rendered

### Requirement: Selecting an SP value updates the card and closes the popover
The system SHALL call `updateCard` with the selected value when a number button is clicked, then close the popover.

#### Scenario: User selects a new SP value
- **WHEN** user clicks a number button (e.g., "7") in the popover
- **THEN** `updateCard` is called with `storyPoint: 7` and the popover closes

#### Scenario: User clicks the already-selected SP value
- **WHEN** user clicks the number that matches the current `card.storyPoint`
- **THEN** `updateCard` is called with `storyPoint: 0` (clear) and the popover closes

### Requirement: REMOVE clears the story point and closes the popover
The system SHALL call `updateCard` with `storyPoint: 0` when REMOVE is clicked, then close the popover.

#### Scenario: User clicks REMOVE
- **WHEN** user clicks the REMOVE button in the popover
- **THEN** `updateCard` is called with `storyPoint: 0` and the popover closes
