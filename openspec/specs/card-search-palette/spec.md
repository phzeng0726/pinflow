## ADDED Requirements

### Requirement: Command Palette search trigger
The system SHALL provide a search button in the BoardPage header that opens a Command Palette dialog. The system SHALL also support `Ctrl+K` (or `Cmd+K` on macOS) keyboard shortcut to open the dialog from anywhere on the BoardPage.

#### Scenario: Open via search button
- **WHEN** user clicks the search icon button in the BoardPage header
- **THEN** a Command Palette dialog opens with an empty search input focused

#### Scenario: Open via keyboard shortcut
- **WHEN** user presses `Ctrl+K` while on the BoardPage
- **THEN** a Command Palette dialog opens with an empty search input focused

#### Scenario: Close dialog
- **WHEN** user presses `Escape` or clicks outside the Command Palette
- **THEN** the dialog closes and search state resets

### Requirement: Real-time card title search
The system SHALL search card titles within the current board as the user types, with a 300ms debounce. The search SHALL NOT include archived cards. The search SHALL use the existing `GET /cards/search` API with `board_id` parameter.

#### Scenario: Search with results
- **WHEN** user types a query that matches one or more card titles in the current board
- **THEN** matching cards are displayed in the results list, grouped by column name

#### Scenario: Search with no results
- **WHEN** user types a query that matches no card titles in the current board
- **THEN** an empty state message is displayed

#### Scenario: Empty query
- **WHEN** the search input is empty
- **THEN** no results are shown (clean empty state)

### Requirement: Navigate to card from search result
The system SHALL allow users to select a search result to open the card's detail dialog. Keyboard navigation (arrow keys + Enter) SHALL be supported.

#### Scenario: Click search result
- **WHEN** user clicks on a card in the search results
- **THEN** the Command Palette closes and the CardDetailDialog opens for that card

#### Scenario: Keyboard select search result
- **WHEN** user navigates to a result using arrow keys and presses Enter
- **THEN** the Command Palette closes and the CardDetailDialog opens for that card

### Requirement: Consistent ghost button styling
All dialog footer "later/decide later" ghost buttons SHALL display a Clock3 icon with consistent spacing (gap-1.5) between the icon and text.

#### Scenario: UpdateDialog later button
- **WHEN** the UpdateDialog is shown with a "Later" action
- **THEN** the button displays a Clock3 icon followed by the text with visible gap

#### Scenario: WorkspaceSourceDialog decide later button
- **WHEN** the WorkspaceSourceDialog is shown with a "Decide Later" action
- **THEN** the button displays a Clock3 icon followed by the text with visible gap
