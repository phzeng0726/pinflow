## Requirements

### Requirement: Create checklist on card
The system SHALL allow creating one or more named checklists on a card via POST /api/cards/:id/checklists.

#### Scenario: Create checklist
- **WHEN** user posts `{"title": "Review Steps"}` to /api/cards/1/checklists
- **THEN** system creates checklist and returns `{id, card_id, title, items: []}` with HTTP 201

### Requirement: List checklists on card
The system SHALL return all checklists (with their items) for a card in the card detail response.

#### Scenario: Card detail includes checklists
- **WHEN** user fetches GET /api/cards/:id
- **THEN** response includes `"checklists": [{id, title, items: [{id, text, completed, position}]}]`

### Requirement: Delete checklist
The system SHALL allow deleting a checklist and all its items via DELETE /api/checklists/:id.

#### Scenario: Delete checklist
- **WHEN** user sends DELETE /api/checklists/1
- **THEN** system deletes the checklist and all its items; returns HTTP 204

### Requirement: Create checklist item (subtask)
The system SHALL allow adding items to a checklist via POST /api/checklists/:id/items.

#### Scenario: Create item
- **WHEN** user posts `{"text": "Write unit tests"}` to /api/checklists/1/items
- **THEN** system appends item with `completed: false` at the end of the list and returns the item with HTTP 201

### Requirement: Update checklist item
The system SHALL allow updating an item's text, completion state, and position via PATCH /api/checklist-items/:id.

#### Scenario: Toggle item completion
- **WHEN** user sends PATCH /api/checklist-items/3 with `{"completed": true}`
- **THEN** system marks item complete and returns updated item

#### Scenario: Edit item text
- **WHEN** user sends PATCH /api/checklist-items/3 with `{"text": "Updated task text"}`
- **THEN** system updates text and returns updated item

### Requirement: Delete checklist item
The system SHALL allow deleting a single checklist item via DELETE /api/checklist-items/:id.

#### Scenario: Delete item
- **WHEN** user sends DELETE /api/checklist-items/3
- **THEN** system deletes the item and returns HTTP 204

### Requirement: Checklist progress summary
The system SHALL include a progress summary (completed count / total count) per checklist in API responses.

#### Scenario: Progress in response
- **WHEN** checklist has 2 of 5 items completed
- **THEN** response includes `"completed_count": 2, "total_count": 5` on the checklist object
