## MODIFIED Requirements

### Requirement: Dialog displays rich fields

The dialog SHALL display title, description, story points, priority, tags, start time, end time, all checklists with their items, and dependencies. The dialog SHALL use a left/right split layout: the left panel contains all existing fields (metadata, tags, dependencies, description, checklists) and the right panel contains the CommentSection. The title header area SHALL remain fixed/sticky at the top of the dialog while both panels scroll independently. The description field SHALL be rendered using the `MarkdownEditor` component, supporting rich text formatting.

#### Scenario: All fields visible

- **WHEN** dialog opens for a card with tags, schedule, priority, checklists, and dependencies
- **THEN** all sections (story points, priority, tags, schedule, checklists, dependencies) are visible and populated in the left panel

#### Scenario: Priority section position

- **WHEN** the dialog opens
- **THEN** the Priority trigger button is rendered between the Story Points section and the Tags section

#### Scenario: Header stays fixed on scroll

- **WHEN** the user scrolls down through long card content
- **THEN** the title input and close button remain visible at the top of the dialog

#### Scenario: Left and right panels scroll independently

- **WHEN** the user scrolls within the left panel
- **THEN** the right panel (CommentSection) does not scroll, and vice versa

#### Scenario: Dialog width accommodates split layout

- **WHEN** the dialog opens
- **THEN** the dialog is rendered with a maximum width of max-w-4xl to provide space for both panels

#### Scenario: Description renders Markdown formatting

- **WHEN** the dialog opens for a card whose description contains Markdown (e.g., headings, bold, lists)
- **THEN** the description is displayed with formatting applied in the MarkdownEditor, not as raw Markdown text

### Requirement: Description supports rich text editing

The dialog SHALL allow the user to edit the card description using the `MarkdownEditor` component. The description SHALL be saved as a Markdown string via the existing `PATCH /cards/:id` API on blur.

#### Scenario: Edit description with formatting

- **WHEN** the user applies formatting (e.g., bold, heading, list) in the description editor
- **THEN** the formatting is reflected immediately in the editor view

#### Scenario: Description saves on blur

- **WHEN** the user finishes editing the description and clicks outside the editor
- **THEN** the description is saved via `PATCH /cards/:id` with the Markdown string representation of the content

#### Scenario: No API call if description unchanged

- **WHEN** the user focuses and then blurs the description editor without making changes
- **THEN** no API call is made
