## MODIFIED Requirements

### Requirement: Dialog displays rich fields
The dialog SHALL display title, description, story points, priority, tags, start time, end time, checklists with their items, and a dependencies section. The Priority selector SHALL be placed between Story Points and Tags.

#### Scenario: All fields visible
- **WHEN** dialog opens for a card with tags, schedule, priority, checklists, and dependencies
- **THEN** all sections (story points, priority, tags, schedule, checklists, dependencies) are visible and populated

#### Scenario: Priority section position
- **WHEN** the dialog opens
- **THEN** the Priority trigger button is rendered between the Story Points section and the Tags section

## ADDED Requirements

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
