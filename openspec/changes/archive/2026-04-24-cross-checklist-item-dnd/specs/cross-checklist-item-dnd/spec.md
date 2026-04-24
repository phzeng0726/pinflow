## ADDED Requirements

### Requirement: Move checklist item with target checklistId
後端 `PATCH /api/v1/checklist-items/:id` SHALL accept a required `checklistId` field when moving a checklist item, specifying the destination checklist (same or different from the current one).

#### Scenario: Move item within the same checklist
- **WHEN** client sends `PATCH /api/v1/checklist-items/1` with `{ "checklistId": 10, "position": 1.5 }` where item 1 already belongs to checklist 10
- **THEN** system updates item position to 1.5 within checklist 10 and returns HTTP 200 with updated item

#### Scenario: Move item to a different checklist on the same card
- **WHEN** client sends `PATCH /api/v1/checklist-items/1` with `{ "checklistId": 20, "position": 2.0 }` where item 1 currently belongs to checklist 10 and checklist 20 is on the same card
- **THEN** system removes item from checklist 10, adds it to checklist 20 with position 2.0, and returns HTTP 200 with updated item (checklistId: 20)

#### Scenario: Move item to checklist on a different card is rejected
- **WHEN** client sends `PATCH /api/v1/checklist-items/1` with a `checklistId` that belongs to a different card
- **THEN** system returns HTTP 400 or 404

### Requirement: Cross-checklist item drag-and-drop in UI
前端 SHALL allow users to drag a checklist item from one checklist and drop it into another checklist on the same card.

#### Scenario: Drag item from checklist A to checklist B
- **WHEN** user drags a checklist item and drops it onto an item in a different checklist
- **THEN** the item immediately moves to the target checklist at the correct position (optimistic update), and a PATCH request is sent with the target `checklistId` and computed `position`

#### Scenario: Drag item within the same checklist
- **WHEN** user drags a checklist item and drops it within the same checklist
- **THEN** behavior is identical to before: item reorders within the same checklist, PATCH request sends same `checklistId` with new `position`

#### Scenario: Failed cross-checklist move reverts UI
- **WHEN** the PATCH request for a cross-checklist item move fails
- **THEN** the UI reverts to the server state via cache invalidation

### Requirement: DndContext shared across all checklists for item drag
前端 item 拖拉的 `DndContext` SHALL be placed at the `ChecklistSection` level (parent of all `ChecklistBlock` components), so items can be dragged across checklist boundaries.

#### Scenario: Item drag handle activates cross-checklist drag
- **WHEN** user initiates a drag on a checklist item (pointer moves more than 5px)
- **THEN** the item can be dragged over items in any checklist on the same card, not just items within its own checklist
