## MODIFIED Requirements

### Requirement: MarkdownEditor provides Source and Rich edit modes

The editor SHALL provide two edit sub-modes accessible via a toggle in the top-right corner of the editor container. The default mode SHALL be **Source** (plain-text Markdown with line numbers). Switching to **Rich** mode SHALL display a Lexical WYSIWYG editor with the fixed toolbar. The mode toggle SHALL use `onMouseDown` + `preventDefault()` to prevent triggering the editor blur / view-mode switch. In Source mode, long lines SHALL wrap to the next visual line rather than extending the editor horizontally.

#### Scenario: Default mode is Source

- **WHEN** the user clicks into the editor for the first time
- **THEN** the Source editor (monospace text area with line numbers) is displayed

#### Scenario: Switch to Rich mode

- **WHEN** the user clicks the "Rich" toggle button while in Source mode
- **THEN** the Rich editor (WYSIWYG with toolbar) is displayed, initialized with the current Markdown value

#### Scenario: Switch back to Source mode

- **WHEN** the user clicks the "Source" toggle button while in Rich mode
- **THEN** the Source editor is displayed, initialized with the current Markdown value

#### Scenario: Mode toggle does not trigger blur/save

- **WHEN** the user clicks the mode toggle button while editing
- **THEN** the editor remains in edit state and no `onBlur` / save is triggered

#### Scenario: Source mode wraps long lines

- **WHEN** the user types a line longer than the editor container width in Source mode
- **THEN** the text SHALL wrap to the next visual line; no horizontal scrollbar SHALL appear on the editor

#### Scenario: Source mode preserves leading whitespace

- **WHEN** the user inputs text with leading spaces or tabs (e.g., code fence indentation) in Source mode
- **THEN** the leading whitespace SHALL be preserved and displayed correctly after line wrapping
