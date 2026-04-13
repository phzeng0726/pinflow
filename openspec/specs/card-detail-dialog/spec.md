## Requirements

### Requirement: Card detail dialog opens from board
The system SHALL provide a dialog/modal that opens when the user clicks a detail trigger on a card (e.g., card title or a dedicated icon).

#### Scenario: Open dialog
- **WHEN** user clicks the card title or detail icon on a board card
- **THEN** system opens a full-screen or large modal dialog showing all card fields

### Requirement: Dialog displays rich fields
The dialog SHALL display title, description, story points, priority, tags, start time, end time, and all checklists with their items. The title header area SHALL remain fixed/sticky at the top of the dialog while the content area below it scrolls independently.

#### Scenario: All fields visible
- **WHEN** dialog opens for a card with tags, schedule, priority, and checklists
- **THEN** all sections (story points, priority, tags, schedule, checklists) are visible and populated

#### Scenario: Priority section position
- **WHEN** the dialog opens
- **THEN** the Priority trigger button is rendered between the Story Points section and the Tags section

#### Scenario: Header stays fixed on scroll
- **WHEN** the user scrolls down through long card content
- **THEN** the title input and close button remain visible at the top of the dialog

### Requirement: Inline tag editing in dialog
The dialog SHALL allow the user to add tags (from existing global tags or by creating a new one) and remove tags from the card without closing the dialog. Clicking any existing tag chip SHALL open the tag management popover, equivalent to clicking the + button.

#### Scenario: Add tag via plus button
- **WHEN** user clicks the + button in the tags section
- **THEN** the tag management popover opens

#### Scenario: Add tag via tag chip click
- **WHEN** user clicks on an existing tag chip (not the X remove button)
- **THEN** the tag management popover opens

#### Scenario: Remove tag does not open popover
- **WHEN** user clicks the X button on a tag chip
- **THEN** the tag is detached from the card and the tag management popover does NOT open

#### Scenario: Remove tag
- **WHEN** user clicks the remove button (X) on a tag chip
- **THEN** tag is detached from the card and removed from display

#### Scenario: Tag chip hover appearance
- **WHEN** user hovers over a colored tag chip
- **THEN** the chip retains its color but becomes slightly transparent (reduced opacity), rather than losing its color entirely

### Requirement: Popover header consistency
All field popovers in the dialog (Story Points, Priority, Schedule, Tags) SHALL display a consistent header section containing the popover title and a close (X) button, separated from the content by a bottom border.

#### Scenario: Story Points popover header
- **WHEN** user opens the Story Points popover
- **THEN** a header with the label "Story Points" and an X close button is visible at the top, separated by a border

#### Scenario: Priority popover header
- **WHEN** user opens the Priority popover
- **THEN** a header with the label "Priority" and an X close button is visible at the top, separated by a border

#### Scenario: Schedule popover header
- **WHEN** user opens the Schedule popover
- **THEN** a header with the label "Schedule" and an X close button is visible at the top, separated by a border

### Requirement: Inline schedule editing in dialog
The dialog SHALL allow the user to set or clear start and end datetimes via a popover button in the metadata row. The Schedule button SHALL be positioned between Priority and Tags in the metadata row.

#### Scenario: No schedule set — button shows icon only
- **WHEN** dialog opens for a card with no start or end time
- **THEN** a Schedule button displaying only a Calendar icon is rendered in the metadata row

#### Scenario: Schedule partially set — button shows summary
- **WHEN** dialog opens for a card with only startTime set
- **THEN** the Schedule button displays a short summary (e.g., "4/13 →")

#### Scenario: Schedule fully set — button shows date range
- **WHEN** dialog opens for a card with both startTime and endTime set
- **THEN** the Schedule button displays a short date range (e.g., "4/13 → 4/20")

#### Scenario: Open popover to set dates
- **WHEN** user clicks the Schedule button
- **THEN** a popover opens containing start time and end time DateTimePicker controls

#### Scenario: Save on popover close
- **WHEN** user changes a date and closes the popover
- **THEN** card schedule is updated via API and the button reflects the new value

#### Scenario: Validation — end before start
- **WHEN** user sets endTime earlier than startTime and attempts to close the popover
- **THEN** popover remains open and an error message is displayed; no API call is made

#### Scenario: Clear all schedule
- **WHEN** at least one date is set and user clicks "清除全部" in the popover
- **THEN** both startTime and endTime are cleared via API and the button reverts to showing only the Calendar icon

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
