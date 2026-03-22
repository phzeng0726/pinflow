## ADDED Requirements

### Requirement: Update checklist title
The system SHALL allow updating a checklist's title via PATCH /api/v1/checklists/:id.

#### Scenario: Update checklist title
- **WHEN** user sends PATCH /api/checklists/1 with `{"title": "Updated Title"}`
- **THEN** system updates the checklist title and returns the updated checklist with HTTP 200

#### Scenario: Update checklist with empty title
- **WHEN** user sends PATCH /api/checklists/1 with `{"title": ""}`
- **THEN** system returns HTTP 400 validation error (title is required)

#### Scenario: Update non-existent checklist
- **WHEN** user sends PATCH /api/checklists/999
- **THEN** system returns HTTP 404

### Requirement: Inline checklist title editing UI
The frontend SHALL allow inline editing of checklist titles. Clicking the title SHALL enter edit mode. Pressing Enter or blurring the input SHALL save the change. Pressing Escape SHALL cancel editing.

#### Scenario: Edit checklist title inline
- **WHEN** user clicks on a checklist title
- **THEN** the title becomes an editable input field with the current title pre-filled

#### Scenario: Save edited title on Enter
- **WHEN** user edits the title and presses Enter
- **THEN** system sends PATCH to update the title and exits edit mode

#### Scenario: Save edited title on blur
- **WHEN** user edits the title and clicks outside the input
- **THEN** system sends PATCH to update the title and exits edit mode

#### Scenario: Cancel editing on Escape
- **WHEN** user presses Escape while editing
- **THEN** edit mode is cancelled, title reverts to original value
