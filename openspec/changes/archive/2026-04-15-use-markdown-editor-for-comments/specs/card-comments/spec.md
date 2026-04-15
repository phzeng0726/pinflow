## MODIFIED Requirements

### Requirement: User can add a comment to a card

The system SHALL allow users to create Markdown-formatted comments on a card via a `MarkdownEditor` in the `CommentSection`. When the create area is collapsed, clicking it SHALL expand and render a `MarkdownEditor` (replacing the previous textarea). The backend API and `authorId` association are unchanged.

#### Scenario: Submit a new comment

- **WHEN** user types text into the `MarkdownEditor` and clicks Save
- **THEN** a new comment is created via POST /api/v1/cards/:id/comments and appears at the top of the comment list

#### Scenario: Empty comment is not submitted

- **WHEN** user clicks Save with an empty or whitespace-only editor content
- **THEN** no API call is made and the Save button remains disabled

#### Scenario: Editor clears after submit

- **WHEN** a comment is successfully created
- **THEN** the `MarkdownEditor` is dismissed and the create area returns to collapsed (placeholder) state

### Requirement: Comments are displayed as rendered Markdown

The system SHALL render each comment's text as Markdown using `ReactMarkdown` with `remarkGfm`. The previous plain-text `<p>` display SHALL be replaced.

#### Scenario: Comment with Markdown formatting

- **WHEN** a comment containing Markdown (bold, lists, code blocks) is displayed
- **THEN** the text is rendered with formatting applied, not shown as raw Markdown syntax

#### Scenario: Plain-text comment (backward compatibility)

- **WHEN** a comment stored as plain text (no Markdown markers) is displayed
- **THEN** the text renders as a normal paragraph with no visual artifacts

### Requirement: User can edit an existing comment

The system SHALL allow inline editing of a comment using a `MarkdownEditor` (replacing the previous textarea). Clicking Edit SHALL replace the rendered Markdown display with a `MarkdownEditor` pre-filled with the current text, accompanied by Save and Cancel buttons.

#### Scenario: Enter edit mode

- **WHEN** user clicks Edit on a comment
- **THEN** the rendered Markdown is replaced with a `MarkdownEditor` containing the current text, with Save and Cancel buttons visible

#### Scenario: Save edited comment

- **WHEN** user modifies the text in the `MarkdownEditor` and clicks Save
- **THEN** PATCH /api/v1/comments/:id is called and the comment displays the updated rendered Markdown

#### Scenario: Cancel editing

- **WHEN** user clicks Cancel while editing
- **THEN** the `MarkdownEditor` is dismissed and the original rendered Markdown is shown unchanged

#### Scenario: Empty edit not saved

- **WHEN** user clears all text in the `MarkdownEditor` and clicks Save
- **THEN** no API call is made and the Save button is disabled
