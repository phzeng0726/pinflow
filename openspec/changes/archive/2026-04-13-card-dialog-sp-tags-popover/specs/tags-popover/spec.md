## ADDED Requirements

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
