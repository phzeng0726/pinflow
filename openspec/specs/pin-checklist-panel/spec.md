# Spec: Pin Checklist Panel

## Purpose

Define the behaviour of the inline checklist panel on `PinnedCardItem`. Users can expand a checklist panel directly from the pin window to view and toggle checklist item completion, without opening the full card detail dialog.

---

## Requirements

### Requirement: Pinned card response includes boardId

The system SHALL include `boardId` in the `GET /api/v1/cards/pinned` response for each card, so the frontend can perform correct query cache invalidation when toggling checklist items.

#### Scenario: Pinned card response has boardId

- **WHEN** client calls `GET /api/v1/cards/pinned`
- **THEN** each card object in the response SHALL include a `boardId` field matching the board the card belongs to

---

### Requirement: Expand checklist panel on pinned card

The frontend SHALL allow users to expand an inline checklist panel on a `PinnedCardItem` by clicking the checklist summary area (CheckSquare icon + count). The panel SHALL be collapsed by default.

#### Scenario: Expand checklist panel

- **WHEN** a pinned card has at least one checklist item (`totalCount > 0`) and the user clicks the checklist summary
- **THEN** the checklist panel expands below the card metadata, showing a checklist selector and item list

#### Scenario: Collapse checklist panel

- **WHEN** the checklist panel is expanded and the user clicks the checklist summary again
- **THEN** the panel collapses

#### Scenario: No expand for cards without checklists

- **WHEN** a pinned card has `totalCount === 0`
- **THEN** the checklist summary area SHALL NOT be interactive or expandable

---

### Requirement: Default checklist selection

The frontend SHALL default to the first checklist (by position) that has at least one incomplete item. If all checklists are fully completed, the first checklist by position SHALL be selected.

#### Scenario: Default to first checklist with incomplete items

- **WHEN** the checklist panel opens and the card has multiple checklists where checklist B has all items complete and checklist A has incomplete items
- **THEN** the checklist with incomplete items SHALL be selected by default

#### Scenario: Fallback to first checklist when all complete

- **WHEN** all checklists on the card have every item completed
- **THEN** the first checklist by position SHALL be selected by default

---

### Requirement: Checklist selector in pin panel

The frontend SHALL display a dropdown selector showing all non-empty checklists (those with at least one item) for the pinned card. Each option SHALL show the checklist title and its `completedCount/totalCount`. If only one non-empty checklist exists, the dropdown selector SHALL be omitted and that checklist SHALL be shown directly without a selector.

#### Scenario: Select a different checklist

- **WHEN** the checklist panel is expanded and the user selects a different checklist from the dropdown
- **THEN** the item list updates to show the items of the selected checklist

#### Scenario: Single checklist omits selector

- **WHEN** the checklist panel is expanded and the card has exactly one non-empty checklist
- **THEN** the dropdown selector SHALL NOT be rendered; the checklist items SHALL be shown directly

#### Scenario: Empty checklists excluded from selector

- **WHEN** the checklist panel is expanded and some checklists have zero items
- **THEN** those empty checklists SHALL NOT appear in the dropdown selector

#### Scenario: External deletion resets selection

- **WHEN** the currently selected checklist is deleted (e.g., from the card detail dialog) and the panel refetches
- **THEN** the selection SHALL reset to the default checklist

---

### Requirement: Toggle checklist item completion from pin panel

The frontend SHALL allow toggling checklist item completion via a checkbox in the pin panel. After toggling, the pinned cards list and checklist summary count SHALL update to reflect the new state.

#### Scenario: Toggle item to completed

- **WHEN** user clicks the checkbox of an incomplete item in the pin panel
- **THEN** system sends `PATCH /api/checklist-items/:id` with `{"completed": true}` and the item displays as completed (strikethrough text)

#### Scenario: Toggle item to incomplete

- **WHEN** user clicks the checkbox of a completed item in the pin panel
- **THEN** system sends `PATCH /api/checklist-items/:id` with `{"completed": false}` and the item displays as incomplete

#### Scenario: Summary count updates after toggle

- **WHEN** an item is toggled in the pin panel
- **THEN** the `completedCount/totalCount` summary on the PinnedCardItem SHALL update to reflect the new state

---

### Requirement: Pin panel is read-only except for item completion

The checklist panel on a `PinnedCardItem` SHALL be read-only. Users SHALL NOT be able to add, edit, delete, or reorder checklists or checklist items from the pin panel.

#### Scenario: No editing affordances in pin panel

- **WHEN** the checklist panel is expanded on a pinned card
- **THEN** there SHALL be no add-item input, no delete buttons, no drag handles, and no editable text fields — only the checklist selector and item checkboxes
