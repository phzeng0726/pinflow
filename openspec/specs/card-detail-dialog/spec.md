## Requirements

### Requirement: Card detail dialog opens from board

The system SHALL provide a dialog/modal that opens when the user clicks a detail trigger on a card (e.g., card title or a dedicated icon).

#### Scenario: Open dialog

- **WHEN** user clicks the card title or detail icon on a board card
- **THEN** system opens a full-screen or large modal dialog showing all card fields

### Requirement: Dialog displays rich fields

The dialog SHALL display title, description, story points, priority, tags, start time, end time, all checklists with their items, and dependencies. The dialog SHALL use a left/right split layout: the left panel contains all existing fields (metadata, tags, dependencies, description, checklists) and the right panel contains the CommentSection. The title header area SHALL remain fixed/sticky at the top of the dialog while both panels scroll independently. The description field SHALL be rendered using the `MarkdownEditor` component, supporting rich text formatting.

#### Scenario: All fields visible

- **WHEN** dialog opens for a card with tags, schedule, priority, checklists, and dependencies
- **THEN** all sections (story points, priority, tags, schedule, checklists, dependencies) are visible and populated in the left panel

#### Scenario: Priority section position

- **WHEN** the dialog opens
- **THEN** the Priority trigger button is rendered between the Story Points section and the Tags section

#### Scenario: Header stays fixed on scroll

- **WHEN** the user scrolls down through long card content
- **THEN** the title input and close button remain visible at the top of the dialog

#### Scenario: Left and right panels scroll independently

- **WHEN** the user scrolls within the left panel
- **THEN** the right panel (CommentSection) does not scroll, and vice versa

#### Scenario: Dialog width accommodates split layout

- **WHEN** the dialog opens
- **THEN** the dialog is rendered with a maximum width of max-w-4xl to provide space for both panels

#### Scenario: Description renders Markdown formatting

- **WHEN** the dialog opens for a card whose description contains Markdown (e.g., headings, bold, lists)
- **THEN** the description is displayed with formatting applied in the MarkdownEditor, not as raw Markdown text

### Requirement: Description supports rich text editing

The dialog SHALL allow the user to edit the card description using the `MarkdownEditor` component. The description SHALL be saved as a Markdown string via the existing `PATCH /cards/:id` API on blur.

#### Scenario: Edit description with formatting

- **WHEN** the user applies formatting (e.g., bold, heading, list) in the description editor
- **THEN** the formatting is reflected immediately in the editor view

#### Scenario: Description saves on blur

- **WHEN** the user finishes editing the description and clicks outside the editor
- **THEN** the description is saved via `PATCH /cards/:id` with the Markdown string representation of the content

#### Scenario: No API call if description unchanged

- **WHEN** the user focuses and then blurs the description editor without making changes
- **THEN** no API call is made

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

### Requirement: Dependencies section in dialog

The dialog SHALL display a Dependencies section showing all existing dependencies for the card, and allow the user to add new dependencies or remove existing ones without closing the dialog.

#### Scenario: Existing dependencies listed

- **WHEN** dialog opens for a card with dependencies
- **THEN** each dependency is shown as a badge with the relation label and the other card's title (e.g., "blocks 前端元件開發")

#### Scenario: Remove dependency

- **WHEN** user clicks the X button on a dependency badge
- **THEN** dependency is deleted and removed from the list immediately

#### Scenario: Open dependency popover

- **WHEN** user clicks the + button in the Dependencies section
- **THEN** two-step dependency popover opens (see card-dependencies spec)

#### Scenario: No dependencies empty state

- **WHEN** card has no dependencies
- **THEN** section shows only the + button with no badges

### Requirement: Dialog changes are persisted

All edits made in the dialog SHALL be persisted to the backend immediately (on each action) or on an explicit save, without requiring a page reload.

#### Scenario: Changes persist after close

- **WHEN** user makes changes and closes the dialog
- **THEN** reopening the dialog shows the same saved state

### Requirement: CommentSection occupies the right panel of the dialog

The dialog SHALL render a CommentSection in a fixed-width right panel (border-left separator). The CommentSection SHALL be self-contained: comment input at the top, scrollable comment list below.

#### Scenario: Right panel is always visible

- **WHEN** the dialog opens for any card
- **THEN** the right panel with CommentSection is visible regardless of whether the card has existing comments
