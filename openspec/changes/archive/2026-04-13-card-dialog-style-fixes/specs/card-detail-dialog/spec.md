## MODIFIED Requirements

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

## ADDED Requirements

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
