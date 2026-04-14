## Purpose

Defines requirements for the card comment feature, covering the full lifecycle of creating, displaying, editing, and deleting comments on a card, as well as backend storage and API endpoints.

## Requirements

### Requirement: User can add a comment to a card

The system SHALL allow users to create text comments on a card via a textarea in the CommentSection. The backend SHALL automatically associate the comment with the current workspace's `workspaceId` as `authorId`; the client SHALL NOT send `authorId` in the request body.

#### Scenario: Submit a new comment

- **WHEN** user types text into the comment textarea and clicks Save
- **THEN** a new comment is created via POST /api/v1/cards/:id/comments and appears at the top of the comment list

#### Scenario: Empty comment is not submitted

- **WHEN** user clicks Save with an empty or whitespace-only textarea
- **THEN** no API call is made and the textarea shows a validation error

#### Scenario: Textarea clears after submit

- **WHEN** a comment is successfully created
- **THEN** the textarea is cleared and ready for the next input

### Requirement: Comments are displayed in reverse chronological order

The system SHALL display all comments for a card with the most recently created comment at the top. Each comment SHALL show: the comment text in a visually distinct card, and a footer row with timestamp, Edit link, and Delete link.

#### Scenario: Comments list populated

- **WHEN** dialog opens for a card with existing comments
- **THEN** comments are shown newest-first, each with text and action links

#### Scenario: No comments empty state

- **WHEN** a card has no comments
- **THEN** the comment list area is empty (no error, no placeholder required)

#### Scenario: Timestamp display

- **WHEN** a comment was created recently
- **THEN** the footer shows a human-readable relative time (e.g., "just now", "3 minutes ago")

### Requirement: User can edit an existing comment

The system SHALL allow inline editing of a comment. Clicking Edit SHALL replace the comment text display with an editable textarea pre-filled with the current text, accompanied by Save and Cancel buttons.

#### Scenario: Enter edit mode

- **WHEN** user clicks Edit on a comment
- **THEN** the comment text is replaced with a textarea containing the current text, with Save and Cancel buttons visible

#### Scenario: Save edited comment

- **WHEN** user modifies the text and clicks Save
- **THEN** PATCH /api/v1/comments/:id is called and the comment displays the updated text

#### Scenario: Cancel editing

- **WHEN** user clicks Cancel while editing
- **THEN** the textarea is dismissed and the original text is shown unchanged

#### Scenario: Empty edit not saved

- **WHEN** user clears all text and clicks Save
- **THEN** no API call is made and a validation error is shown

### Requirement: User can delete a comment with confirmation

The system SHALL require a confirmation step before deleting a comment. Clicking Delete SHALL open an inline Popover with a brief confirmation message and two buttons: confirm delete and cancel.

#### Scenario: Delete popover appears

- **WHEN** user clicks Delete on a comment
- **THEN** a Popover opens near the Delete link showing a confirmation message

#### Scenario: Confirm deletion

- **WHEN** user clicks the confirm button inside the Popover
- **THEN** DELETE /api/v1/comments/:id is called and the comment is removed from the list

#### Scenario: Cancel deletion

- **WHEN** user clicks Cancel inside the Popover
- **THEN** the Popover closes and the comment remains unchanged

### Requirement: Comments are persisted in card JSON storage

The backend SHALL store comments embedded within the card's JSON file, following the same strategy as Checklists. Missing `comments` field in existing card files SHALL be treated as an empty array.

#### Scenario: Comment persists after dialog close

- **WHEN** user adds a comment and closes the dialog
- **THEN** reopening the dialog shows the same comment

#### Scenario: Backward compatibility with existing cards

- **WHEN** a card JSON file does not have a `comments` field
- **THEN** the system treats it as having zero comments and does not error

### Requirement: Comment API endpoints

The backend SHALL expose the following endpoints:
- `POST /api/v1/cards/:id/comments` — create a comment
- `PATCH /api/v1/comments/:id` — update comment text
- `DELETE /api/v1/comments/:id` — delete a comment

Comments SHALL be returned as part of the card detail response (embedded in CardResponse).

#### Scenario: Create comment returns 201

- **WHEN** POST /api/v1/cards/:id/comments is called with valid text
- **THEN** response status is 201 and body contains the created CommentResponse

#### Scenario: Update comment returns 200

- **WHEN** PATCH /api/v1/comments/:id is called with valid text
- **THEN** response status is 200 and body contains the updated CommentResponse

#### Scenario: Delete comment returns 204

- **WHEN** DELETE /api/v1/comments/:id is called for an existing comment
- **THEN** response status is 204 and the comment no longer appears in card detail

#### Scenario: Comment not found returns 404

- **WHEN** PATCH or DELETE is called with a non-existent comment ID
- **THEN** response status is 404
