## Requirements

### Requirement: Board-scoped tag creation
The system SHALL allow creating tags scoped to a specific board via `POST /api/v1/boards/:id/tags`. Tag names MUST be unique within a board (case-insensitive). If a tag with the same name already exists in that board, the system SHALL return the existing tag. Tag names MAY be reused across different boards as independent entities with separate IDs. Each board's tags use a per-board ID counter starting at 1.

#### Scenario: Create new board-scoped tag
- **WHEN** user sends POST /api/v1/boards/1/tags with `{"name": "urgent", "color": "red"}`
- **THEN** system creates tag with a per-board ID and returns `{id, name, color, boardId}` with HTTP 201

#### Scenario: Duplicate tag name within same board
- **WHEN** user sends POST /api/v1/boards/1/tags with a name that already exists in board 1
- **THEN** system returns the existing tag with HTTP 200

#### Scenario: Same tag name in different boards is allowed
- **WHEN** board 1 has tag "Bug" and user sends POST /api/v1/boards/2/tags with `{"name": "Bug"}`
- **THEN** system creates a new independent tag with a different ID in board 2 and returns HTTP 201

#### Scenario: Board not found
- **WHEN** user sends POST /api/v1/boards/999/tags
- **THEN** system returns HTTP 404

### Requirement: Board-scoped tag list
The system SHALL expose `GET /api/v1/boards/:id/tags` returning all tags belonging to that board, ordered by name.

#### Scenario: List board tags
- **WHEN** user sends GET /api/v1/boards/1/tags
- **THEN** system returns array of tags `{id, name, color}` belonging to board 1, ordered by name

#### Scenario: Empty board
- **WHEN** board has no tags
- **THEN** response returns empty array with HTTP 200

#### Scenario: Board not found
- **WHEN** user sends GET /api/v1/boards/999/tags
- **THEN** system returns HTTP 404

### Requirement: Cross-board tag attach is rejected
The system SHALL reject any attempt to attach a tag to a card when the tag belongs to a different board than the card.

#### Scenario: Cross-board attach rejected
- **WHEN** user sends POST /api/v1/cards/:cardId/tags with a tag_id belonging to a different board
- **THEN** system returns HTTP 422 with an error indicating cross-board tag assignment is not allowed

### Requirement: Attach tag to card
The system SHALL allow attaching one or more tags to a card via POST /api/cards/:id/tags. The tag MUST belong to the same board as the card.

#### Scenario: Attach existing tag
- **WHEN** user posts `{"tag_id": 5}` to /api/cards/1/tags and tag 5 belongs to the same board as card 1
- **THEN** system creates the card-tag association and returns updated tag list with HTTP 200

#### Scenario: Attach already-associated tag
- **WHEN** the tag is already associated with the card
- **THEN** system returns HTTP 200 without duplicating the association

#### Scenario: Attach tag from different board
- **WHEN** user posts with a tag_id belonging to a different board than card 1
- **THEN** system returns HTTP 422

### Requirement: Detach tag from card
The system SHALL allow removing a tag association from a card via DELETE /api/cards/:id/tags/:tagId without deleting the global tag.

#### Scenario: Detach tag
- **WHEN** user sends DELETE /api/cards/1/tags/5
- **THEN** system removes the association and returns HTTP 204; the global tag record is not deleted

### Requirement: List tags on card
The system SHALL return the card's associated tags (including color) in the card response DTO.

#### Scenario: Card response includes tags
- **WHEN** user fetches GET /api/cards/:id
- **THEN** response includes `"tags": [{id, name, color}, ...]`

### Requirement: Tag color field
The system SHALL support an optional `color` field on Tag. The value MUST be a predefined color key string (e.g., `"red"`, `"blue"`, `"green"`) or empty string (no color). The field SHALL be included in all Tag response DTOs.

#### Scenario: Create tag with color
- **WHEN** user sends POST /api/tags with `{"name": "urgent", "color": "red"}`
- **THEN** system creates tag and returns `{id, name, color}` with HTTP 201

#### Scenario: Create tag without color
- **WHEN** user sends POST /api/tags with `{"name": "review"}` (no color field)
- **THEN** system creates tag with `color: ""` and returns `{id, name, color}`

### Requirement: Update tag
The system SHALL allow updating a tag's name and/or color via PATCH /api/v1/tags/:id.

#### Scenario: Update tag name
- **WHEN** user sends PATCH /api/tags/1 with `{"name": "critical"}`
- **THEN** system updates the tag name and returns the updated tag

#### Scenario: Update tag color
- **WHEN** user sends PATCH /api/tags/1 with `{"color": "blue"}`
- **THEN** system updates the tag color and returns the updated tag

#### Scenario: Update tag with duplicate name
- **WHEN** user sends PATCH /api/tags/1 with a name that already exists on another tag
- **THEN** system returns HTTP 409 conflict error

#### Scenario: Update non-existent tag
- **WHEN** user sends PATCH /api/tags/999
- **THEN** system returns HTTP 404

### Requirement: Delete tag
The system SHALL allow deleting a global tag via DELETE /api/v1/tags/:id. Deleting a tag MUST remove all card-tag associations (CASCADE).

#### Scenario: Delete tag
- **WHEN** user sends DELETE /api/tags/1
- **THEN** system deletes the tag and all card-tag associations; returns HTTP 204

#### Scenario: Delete non-existent tag
- **WHEN** user sends DELETE /api/tags/999
- **THEN** system returns HTTP 404

### Requirement: Color picker in tag creation/editing UI
The frontend SHALL display a color palette with predefined Tailwind color options when creating or editing a tag. Colors SHALL include: red, orange, amber, yellow, lime, green, emerald, cyan, blue, violet, purple, pink.

#### Scenario: Select color when creating tag
- **WHEN** user creates a new tag and selects a color from the palette
- **THEN** the tag is created with the selected color

#### Scenario: Change color when editing tag
- **WHEN** user edits a tag and selects a different color
- **THEN** the tag color is updated and reflected everywhere the tag appears

### Requirement: Tag edit/delete UI
The frontend SHALL provide edit and delete actions for global tags. Delete action MUST show a confirmation dialog before proceeding.

#### Scenario: Edit tag from tag management
- **WHEN** user clicks edit on a tag
- **THEN** an edit form appears with current name and color, allowing modification

#### Scenario: Delete tag with confirmation
- **WHEN** user clicks delete on a tag
- **THEN** a confirmation dialog appears; on confirm, the tag is deleted

### Requirement: Tags trigger area shows selected tags and add button
The system SHALL display selected tags as Badges before the `+` trigger button. Each Badge SHALL have an `×` button to detach the tag directly without opening the popover.

#### Scenario: Selected tags appear as Badges
- **WHEN** the card has tags attached
- **THEN** each tag is rendered as a Badge with its color and name, followed by a `+` button

#### Scenario: Quick detach via Badge × button
- **WHEN** user clicks the `×` on a tag Badge outside the popover
- **THEN** `detachTag` is called for that tag immediately

#### Scenario: No tags shows only add button
- **WHEN** the card has no tags attached
- **THEN** only the `+` button is rendered

### Requirement: Tags popover list view
The system SHALL show a list view by default when the Tags popover is opened. The list view SHALL include a search input, a list of the **current board's** tags with checkboxes and edit buttons, and a "Create a new tag" button at the bottom. Only tags belonging to the card's board SHALL be shown.

#### Scenario: Popover opens on + button click
- **WHEN** user clicks the `+` trigger button
- **THEN** the popover opens showing the list view with title "Tags"

#### Scenario: Only current board tags are shown
- **WHEN** workspace has tags in multiple boards
- **THEN** the list view shows ONLY tags belonging to the current card's board

#### Scenario: Checkbox reflects attach state
- **WHEN** a tag is attached to the current card
- **THEN** its checkbox in the list view is checked

#### Scenario: Checking an unchecked tag attaches it
- **WHEN** user checks an unchecked tag checkbox
- **THEN** `attachTag` is called with that tag's id

#### Scenario: Unchecking a checked tag detaches it
- **WHEN** user unchecks a checked tag checkbox
- **THEN** `detachTag` is called with that tag's id

#### Scenario: Search filters the tag list
- **WHEN** user types in the search input
- **THEN** only tags whose name contains the search string (case-insensitive) are shown

#### Scenario: Edit button navigates to edit view
- **WHEN** user clicks the pencil icon next to a tag
- **THEN** the popover switches to the edit view for that tag

#### Scenario: Create button navigates to create view
- **WHEN** user clicks "Create a new tag"
- **THEN** the popover switches to the create view

### Requirement: Tags popover create view
The system SHALL show a create view with a color preview bar, a Title input, a 13-color grid selector, a "Remove color" button, and a Create button.

#### Scenario: Color preview updates as color is selected
- **WHEN** user selects a color from the grid
- **THEN** the preview bar updates to reflect that color

#### Scenario: Remove color clears the color selection
- **WHEN** user clicks "Remove color"
- **THEN** the color selection is cleared and the preview bar shows the default (gray)

#### Scenario: Create button creates tag and returns to list
- **WHEN** user enters a name and clicks Create
- **THEN** `createTag` is called with the name and selected color, then the view returns to list

#### Scenario: Back button returns to list view
- **WHEN** user clicks the `<` back button in the create view
- **THEN** the popover switches back to the list view

### Requirement: Tags popover edit view
The system SHALL show an edit view with the same layout as create (color preview, name input, color grid, Remove color), plus a Save button and a Delete button.

#### Scenario: Edit view pre-fills existing tag data
- **WHEN** the edit view opens for a tag
- **THEN** the name input and color grid are pre-populated with the tag's current name and color

#### Scenario: Save updates the tag and returns to list
- **WHEN** user edits name/color and clicks Save
- **THEN** `updateTag` is called with the new values, then the view returns to list

#### Scenario: Delete button navigates to delete-confirm view
- **WHEN** user clicks the Delete button in edit view
- **THEN** the popover switches to the delete-confirm view for that tag

### Requirement: Tags popover delete-confirm view
The system SHALL replace the popover content with a confirmation screen showing a warning message, a Cancel button, and a Delete button. No external AlertDialog SHALL be used.

#### Scenario: Delete-confirm view shows warning text
- **WHEN** the delete-confirm view is displayed
- **THEN** a warning message is shown stating the deletion is irreversible and the tag will be removed from all cards

#### Scenario: Cancel returns to edit view
- **WHEN** user clicks Cancel in the delete-confirm view
- **THEN** the popover switches back to the edit view for the same tag

#### Scenario: Delete executes deletion and returns to list
- **WHEN** user clicks Delete in the delete-confirm view
- **THEN** `deleteTag` is called for that tag, and on success the view returns to list

#### Scenario: X button in delete-confirm returns to edit view
- **WHEN** user clicks the X close icon in the delete-confirm header
- **THEN** the popover switches back to the edit view (not closed entirely)

### Requirement: Color constants are shared via tagColors.ts
The system SHALL export `TAG_COLORS` and `getTagColorClasses` from `tagColors.ts`. All components that need tag color utilities SHALL import from this module.

#### Scenario: CardItem uses tagColors.ts
- **WHEN** `CardItem.tsx` renders tag colors
- **THEN** it imports `getTagColorClasses` from `tagColors.ts`, not from `ColorPicker.tsx`

#### Scenario: TagsPopover uses tagColors.ts
- **WHEN** `TagsPopover.tsx` renders the color grid or tag color bars
- **THEN** it imports `TAG_COLORS` and `getTagColorClasses` from `tagColors.ts`
