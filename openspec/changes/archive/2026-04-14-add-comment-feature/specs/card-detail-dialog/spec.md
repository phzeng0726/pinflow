## MODIFIED Requirements

### Requirement: Dialog displays rich fields
The dialog SHALL display title, description, story points, priority, tags, start time, end time, all checklists with their items, and dependencies. The dialog SHALL use a left/right split layout: the left panel contains all existing fields (metadata, tags, dependencies, description, checklists) and the right panel contains the CommentSection. The title header area SHALL remain fixed/sticky at the top of the dialog while both panels scroll independently.

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

## ADDED Requirements

### Requirement: CommentSection occupies the right panel of the dialog
The dialog SHALL render a CommentSection in a fixed-width right panel (border-left separator). The CommentSection SHALL be self-contained: comment input at the top, scrollable comment list below.

#### Scenario: Right panel is always visible
- **WHEN** the dialog opens for any card
- **THEN** the right panel with CommentSection is visible regardless of whether the card has existing comments
