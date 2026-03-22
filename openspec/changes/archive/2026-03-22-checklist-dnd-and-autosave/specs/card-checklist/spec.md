## MODIFIED Requirements

### Requirement: Update checklist title
The system SHALL allow updating a checklist's title and/or position via PATCH /api/v1/checklists/:id. The request body uses optional fields: `title` (*string) and `position` (*float64). At least one field MUST be provided.

#### Scenario: Update checklist title
- **WHEN** user sends PATCH /api/checklists/1 with `{"title": "Updated Title"}`
- **THEN** system updates the checklist title and returns the updated checklist with HTTP 200

#### Scenario: Update checklist with empty title
- **WHEN** user sends PATCH /api/checklists/1 with `{"title": ""}`
- **THEN** system returns HTTP 400 validation error (title is required)

#### Scenario: Update non-existent checklist
- **WHEN** user sends PATCH /api/checklists/999
- **THEN** system returns HTTP 404

#### Scenario: Update checklist position only
- **WHEN** user sends PATCH /api/checklists/1 with `{"position": 2.5}`
- **THEN** system updates only the position, title remains unchanged, returns HTTP 200

### Requirement: Inline checklist title editing UI
The frontend SHALL allow inline editing of checklist titles. Clicking the title SHALL enter edit mode. Pressing Enter or blurring the input SHALL save the change. Pressing Escape SHALL cancel editing. Saving SHALL also occur when the dialog is dismissed (e.g., clicking the backdrop overlay).

#### Scenario: Edit checklist title inline
- **WHEN** user clicks on a checklist title
- **THEN** the title becomes an editable input field with the current title pre-filled

#### Scenario: Save edited title on Enter
- **WHEN** user edits the title and presses Enter
- **THEN** system sends PATCH to update the title and exits edit mode

#### Scenario: Save edited title on blur
- **WHEN** user edits the title and clicks outside the input (within the dialog)
- **THEN** system sends PATCH to update the title and exits edit mode

#### Scenario: Save edited title when dialog dismissed via backdrop
- **WHEN** user is editing the title and clicks the dialog backdrop overlay to close
- **THEN** system SHALL save the pending title change before the dialog closes

#### Scenario: Cancel editing on Escape
- **WHEN** user presses Escape while editing
- **THEN** edit mode is cancelled, title reverts to original value

## ADDED Requirements

### Requirement: Checklist item inline editing with auto-save on blur
The frontend SHALL allow inline editing of checklist item text. Clicking the item text SHALL enter edit mode. Pressing Enter or blurring the input SHALL save the change if the value has changed. Pressing Escape SHALL cancel editing.

#### Scenario: Enter edit mode
- **WHEN** user clicks on a checklist item's text
- **THEN** the text becomes an editable input field with the current text pre-filled

#### Scenario: Save edited text on blur
- **WHEN** user edits the item text and clicks outside the input (blur)
- **THEN** system sends PATCH to update the text and exits edit mode

#### Scenario: Save edited text on Enter
- **WHEN** user edits the item text and presses Enter
- **THEN** system sends PATCH to update the text and exits edit mode

#### Scenario: No save when text unchanged
- **WHEN** user enters edit mode but does not change the text, then blurs or presses Enter
- **THEN** system exits edit mode without sending a PATCH request

#### Scenario: Save edited text when dialog dismissed via backdrop
- **WHEN** user is editing item text and clicks the dialog backdrop overlay to close
- **THEN** system SHALL save the pending text change before the dialog closes

#### Scenario: Cancel editing on Escape
- **WHEN** user presses Escape while editing item text
- **THEN** edit mode is cancelled, text reverts to original value

#### Scenario: Confirm button removed
- **WHEN** user is editing a checklist item
- **THEN** there SHALL be no separate confirm/save button — saving is automatic on blur or Enter
