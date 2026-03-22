## ADDED Requirements

### Requirement: Card detail dialog opens from board
The system SHALL provide a dialog/modal that opens when the user clicks a detail trigger on a card (e.g., card title or a dedicated icon).

#### Scenario: Open dialog
- **WHEN** user clicks the card title or detail icon on a board card
- **THEN** system opens a full-screen or large modal dialog showing all card fields

### Requirement: Dialog displays rich fields
The dialog SHALL display title, description, tags, start time, end time, and all checklists with their items.

#### Scenario: All fields visible
- **WHEN** dialog opens for a card with tags, schedule, and checklists
- **THEN** all sections (tags, schedule, checklists) are visible and populated

### Requirement: Inline tag editing in dialog
The dialog SHALL allow the user to add tags (from existing global tags or by creating a new one) and remove tags from the card without closing the dialog.

#### Scenario: Add tag
- **WHEN** user types in the tag input and selects a suggestion or presses enter
- **THEN** tag is attached to the card and appears in the tag list immediately

#### Scenario: Remove tag
- **WHEN** user clicks the remove button on a tag chip
- **THEN** tag is detached from the card and removed from display

### Requirement: Inline schedule editing in dialog
The dialog SHALL allow the user to set or clear start and end datetimes using datetime picker inputs.

#### Scenario: Set dates
- **WHEN** user picks dates in the start/end datetime pickers and saves
- **THEN** card schedule is updated and reflected in the dialog

### Requirement: Checklist management in dialog
The dialog SHALL allow the user to create new checklists, add items, toggle item completion, edit item text, delete items, and delete checklists.

#### Scenario: Add checklist
- **WHEN** user clicks "Add checklist" and enters a title
- **THEN** new empty checklist appears in the dialog

#### Scenario: Add item to checklist
- **WHEN** user clicks "Add item" under a checklist and types text
- **THEN** item is created and appears at the bottom of the checklist

#### Scenario: Toggle item
- **WHEN** user checks/unchecks a checklist item checkbox
- **THEN** item completion state is updated immediately (optimistic update)

#### Scenario: Delete item
- **WHEN** user clicks delete on a checklist item
- **THEN** item is removed from the list

### Requirement: Dialog changes are persisted
All edits made in the dialog SHALL be persisted to the backend immediately (on each action) or on an explicit save, without requiring a page reload.

#### Scenario: Changes persist after close
- **WHEN** user makes changes and closes the dialog
- **THEN** reopening the dialog shows the same saved state
