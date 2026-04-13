## Requirements

### Requirement: Global tag creation
The system SHALL allow users to create named tags globally (not board-scoped). Tag names MUST be unique (case-insensitive). If a tag with the same name already exists the system SHALL return the existing tag instead of creating a duplicate. The create request MAY include a `color` field.

#### Scenario: Create new tag
- **WHEN** user submits POST /api/tags with `{"name": "urgent", "color": "red"}`
- **THEN** system creates tag and returns `{id, name, color}` with HTTP 201

#### Scenario: Duplicate tag name
- **WHEN** user submits POST /api/tags with a name that already exists
- **THEN** system returns the existing tag with HTTP 200

### Requirement: Attach tag to card
The system SHALL allow attaching one or more tags to a card via POST /api/cards/:id/tags.

#### Scenario: Attach existing tag
- **WHEN** user posts `{"tag_id": 5}` to /api/cards/1/tags
- **THEN** system creates the card-tag association and returns updated tag list with HTTP 200

#### Scenario: Attach already-associated tag
- **WHEN** the tag is already associated with the card
- **THEN** system returns HTTP 200 without duplicating the association

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

### Requirement: List all global tags
The system SHALL expose GET /api/tags returning all tags (including color) for use in tag pickers.

#### Scenario: List tags
- **WHEN** user sends GET /api/tags
- **THEN** system returns array of all tags with `{id, name, color}` ordered by name

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
The system SHALL show a list view by default when the Tags popover is opened. The list view SHALL include a search input, a list of all global tags with checkboxes and edit buttons, and a "Create a new tag" button at the bottom.

#### Scenario: Popover opens on + button click
- **WHEN** user clicks the `+` trigger button
- **THEN** the popover opens showing the list view with title "Tags"

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
