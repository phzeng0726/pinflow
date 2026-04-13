## MODIFIED Requirements

### Requirement: Dialog displays rich fields

The dialog SHALL display title, description, story points, priority, tags, start time, end time, and all checklists with their items. The Priority selector SHALL be placed between Story Points and Tags.

#### Scenario: All fields visible

- **WHEN** dialog opens for a card with tags, schedule, priority, and checklists
- **THEN** all sections (story points, priority, tags, schedule, checklists) are visible and populated

#### Scenario: Priority section position

- **WHEN** the dialog opens
- **THEN** the Priority trigger button is rendered between the Story Points section and the Tags section
