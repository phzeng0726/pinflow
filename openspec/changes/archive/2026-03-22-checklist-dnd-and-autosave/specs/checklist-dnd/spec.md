## ADDED Requirements

### Requirement: Checklist position field
The backend SHALL support a `position` field (float64) on the Checklist model for ordering checklists within a card.

#### Scenario: New checklist gets auto-assigned position
- **WHEN** user creates a new checklist on a card
- **THEN** system assigns `position` as max existing position + 1.0 (or 1.0 if first checklist)

#### Scenario: Checklists returned in position order
- **WHEN** user fetches card detail
- **THEN** checklists in the response SHALL be ordered by `position` ascending

### Requirement: Update checklist position via API
The system SHALL allow updating a checklist's position via PATCH /api/v1/checklists/:id with `{"position": <float64>}`.

#### Scenario: Update checklist position
- **WHEN** user sends PATCH /api/checklists/1 with `{"position": 2.5}`
- **THEN** system updates the checklist position and returns the updated checklist with HTTP 200

#### Scenario: Update checklist position only (no title change)
- **WHEN** user sends PATCH /api/checklists/1 with `{"position": 1.5}` (no title field)
- **THEN** system updates only the position, title remains unchanged

### Requirement: Checklist DnD reordering in UI
The frontend SHALL allow drag-and-drop reordering of checklists within a card detail dialog using @dnd-kit/sortable.

#### Scenario: Drag checklist to new position
- **WHEN** user drags a checklist block above or below another checklist
- **THEN** the UI immediately reflects the new order (optimistic update) and a PATCH request is sent to update the position

#### Scenario: Failed reorder reverts UI
- **WHEN** the PATCH request to update checklist position fails
- **THEN** the UI reverts to the server state via cache invalidation

### Requirement: Checklist item DnD reordering in UI
The frontend SHALL allow drag-and-drop reordering of checklist items within the same checklist using @dnd-kit/sortable.

#### Scenario: Drag item to new position within checklist
- **WHEN** user drags a checklist item above or below another item in the same checklist
- **THEN** the UI immediately reflects the new order (optimistic update) and a PATCH request is sent to update the item's position

#### Scenario: Failed item reorder reverts UI
- **WHEN** the PATCH request to update item position fails
- **THEN** the UI reverts to the server state via cache invalidation

### Requirement: DnD visual feedback
The frontend SHALL provide visual feedback during drag operations.

#### Scenario: Drag handle visible
- **WHEN** user hovers over a checklist or checklist item
- **THEN** a drag handle icon (GripVertical) SHALL be visible

#### Scenario: Active drag state
- **WHEN** user is dragging a checklist or item
- **THEN** the dragged element SHALL have a distinct visual style (opacity, shadow, or border)
