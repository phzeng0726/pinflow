## Purpose

A reusable `MarkdownEditor` React component that provides Lexical-based rich text editing with Source (plain Markdown) and Rich (WYSIWYG) sub-modes, a fixed toolbar, and full Markdown import/export. Used wherever the application needs structured text input (e.g., card description in the card detail dialog).

## Requirements

### Requirement: MarkdownEditor renders a Lexical-based rich text editing area

The system SHALL provide a `MarkdownEditor` React component that renders a Lexical rich text editor with a fixed toolbar above the content area. The component SHALL accept `value` (Markdown string), `onChange`, `onBlur`, and `placeholder` props.

#### Scenario: Editor renders with initial value

- **WHEN** `MarkdownEditor` is mounted with a non-empty `value` prop containing Markdown
- **THEN** the editor displays the content with formatting applied (e.g., `## Heading` renders as a heading, `**bold**` renders as bold text)

#### Scenario: Editor renders placeholder when empty

- **WHEN** `MarkdownEditor` is mounted with an empty `value` prop
- **THEN** the placeholder text is displayed in the content area

#### Scenario: Toolbar is always visible

- **WHEN** the editor is rendered
- **THEN** a fixed toolbar containing format buttons is displayed above the content area regardless of editor focus state

### Requirement: MarkdownEditor supports heading formatting

The editor SHALL support H1, H2, and H3 heading levels via the toolbar and via Markdown shortcuts.

#### Scenario: Apply heading via toolbar

- **WHEN** the cursor is inside a paragraph and the user selects a heading level from the toolbar heading dropdown
- **THEN** the current block is converted to the selected heading level

#### Scenario: Apply heading via Markdown shortcut

- **WHEN** the user types `# ` at the start of a line
- **THEN** the line is converted to H1; `## ` converts to H2; `### ` converts to H3

#### Scenario: Remove heading via toolbar

- **WHEN** the cursor is inside a heading block and the user selects the same heading level again from the toolbar
- **THEN** the block is converted back to a normal paragraph

### Requirement: MarkdownEditor supports inline text formatting

The editor SHALL support bold and italic inline formatting via toolbar buttons and Markdown shortcuts.

#### Scenario: Apply bold via toolbar

- **WHEN** the user selects text and clicks the Bold button in the toolbar
- **THEN** the selected text is rendered in bold

#### Scenario: Apply bold via Markdown shortcut

- **WHEN** the user wraps text with `**` (e.g., `**text**`)
- **THEN** the text is rendered in bold and the `**` markers are removed

#### Scenario: Apply italic via toolbar

- **WHEN** the user selects text and clicks the Italic button in the toolbar
- **THEN** the selected text is rendered in italic

#### Scenario: Apply italic via Markdown shortcut

- **WHEN** the user wraps text with `*` or `_` (e.g., `*text*`)
- **THEN** the text is rendered in italic and the markers are removed

#### Scenario: Active state shown in toolbar

- **WHEN** the cursor is positioned within bold or italic text
- **THEN** the corresponding toolbar button is visually highlighted (active state)

### Requirement: MarkdownEditor supports inline code and code blocks

The editor SHALL support inline code (single backtick) and fenced code blocks (triple backtick) via toolbar and Markdown shortcuts.

#### Scenario: Apply inline code via toolbar

- **WHEN** the user selects text and clicks the inline code button in the toolbar
- **THEN** the selected text is rendered in monospace inline code style

#### Scenario: Apply inline code via Markdown shortcut

- **WHEN** the user wraps text with single backticks (e.g., `` `code` ``)
- **THEN** the text is rendered as inline code and the backtick markers are removed

#### Scenario: Insert code block via toolbar

- **WHEN** the user clicks the code block button in the toolbar
- **THEN** a fenced code block is inserted at the current position

#### Scenario: Insert code block via Markdown shortcut

- **WHEN** the user types ` ``` ` at the start of a line and presses Enter
- **THEN** a code block is created

### Requirement: MarkdownEditor supports blockquotes

The editor SHALL support blockquote formatting via toolbar button and `> ` Markdown shortcut.

#### Scenario: Apply blockquote via toolbar

- **WHEN** the cursor is inside a paragraph and the user clicks the blockquote button in the toolbar
- **THEN** the current block is converted to a blockquote

#### Scenario: Apply blockquote via Markdown shortcut

- **WHEN** the user types `> ` at the start of a line
- **THEN** the line is converted to a blockquote block

### Requirement: MarkdownEditor supports lists and checkboxes

The editor SHALL support unordered lists, ordered lists, and checkbox lists via toolbar buttons and Markdown shortcuts.

#### Scenario: Insert unordered list via toolbar

- **WHEN** the user clicks the unordered list button in the toolbar
- **THEN** the current block is converted to an unordered list item

#### Scenario: Insert unordered list via Markdown shortcut

- **WHEN** the user types `- ` or `* ` at the start of a line
- **THEN** the line is converted to an unordered list item

#### Scenario: Insert ordered list via toolbar

- **WHEN** the user clicks the ordered list button in the toolbar
- **THEN** the current block is converted to an ordered list item starting at 1

#### Scenario: Insert ordered list via Markdown shortcut

- **WHEN** the user types `1. ` at the start of a line
- **THEN** the line is converted to an ordered list item

#### Scenario: Insert checkbox via Markdown shortcut

- **WHEN** the user types `- [ ] ` at the start of a line
- **THEN** the line is converted to an unchecked checkbox list item

#### Scenario: Toggle checkbox state

- **WHEN** the user clicks the checkbox indicator on a checkbox list item
- **THEN** the item toggles between checked (`- [x]`) and unchecked (`- [ ]`) state

### Requirement: MarkdownEditor supports link insertion

The editor SHALL support inserting hyperlinks via a toolbar button.

#### Scenario: Insert link via toolbar

- **WHEN** the user clicks the link button in the toolbar
- **THEN** the system prompts for a URL; upon confirmation the selected text (or a new link) is rendered as a hyperlink

#### Scenario: Link renders as clickable anchor

- **WHEN** a Markdown string containing `[text](url)` is loaded into the editor
- **THEN** the link is rendered with the link text visible and styled as a hyperlink

### Requirement: MarkdownEditor supports horizontal rule

The editor SHALL support inserting a horizontal rule via toolbar button and `---` Markdown shortcut.

#### Scenario: Insert horizontal rule via toolbar

- **WHEN** the user clicks the horizontal rule button in the toolbar
- **THEN** a horizontal divider is inserted at the current cursor position

#### Scenario: Insert horizontal rule via Markdown shortcut

- **WHEN** the user types `---` on an empty line and presses Enter
- **THEN** a horizontal rule element is inserted

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

### Requirement: MarkdownEditor exports Markdown on change and blur

The editor SHALL call `onChange` with the current Markdown string on every meaningful content change, and call `onBlur` when the editor loses focus.

#### Scenario: onChange called on content change

- **WHEN** the user types or applies formatting in the editor
- **THEN** `onChange` is called with the updated Markdown string representation of the content

#### Scenario: onBlur called when editor loses focus

- **WHEN** the user clicks outside the editor (including clicking toolbar buttons does NOT trigger this)
- **THEN** `onBlur` is called once

#### Scenario: Toolbar button click does not trigger onBlur

- **WHEN** the user clicks a toolbar format button while the editor is focused
- **THEN** editor focus is retained and `onBlur` is NOT called

### Requirement: MarkdownEditor is dark mode compatible

The editor SHALL adapt its visual appearance based on the active color scheme.

#### Scenario: Dark mode styling

- **WHEN** the application is in dark mode
- **THEN** the editor background, text, toolbar, and content formatting (code blocks, blockquotes) use dark mode colors consistent with the rest of the application

### Requirement: View mode preserves single line breaks

View mode（非編輯狀態）SHALL 將使用者輸入的每一個單行換行（`\n`）渲染為可見的換行（`<br>`），而非空格。

#### Scenario: Single line break renders as line break

- **WHEN** 使用者在編輯模式輸入 `line1\nline2`（兩行文字以單個換行分隔）
- **THEN** 檢視模式 SHALL 將兩行分別顯示在不同行上，中間以換行分隔

#### Scenario: Markdown syntax with line breaks

- **WHEN** 使用者輸入包含 Markdown 語法的多行文字（例如 `# Heading\nbody text`）
- **THEN** 檢視模式 SHALL 正確渲染 Markdown 語法（標題、清單等），同時保留段落內的換行

### Requirement: View mode preserves multiple consecutive blank lines

View mode SHALL 忠實呈現使用者輸入的連續空白行數量，產生對應比例的視覺間距。

#### Scenario: Double line break renders as paragraph break

- **WHEN** 使用者在編輯模式輸入 `line1\n\nline2`（以兩個換行分隔）
- **THEN** 檢視模式 SHALL 顯示一個段落分隔（標準 Markdown 行為）

#### Scenario: Triple line break renders more space than double

- **WHEN** 使用者在編輯模式輸入 `line1\n\n\nline2`（以三個換行分隔）
- **THEN** 檢視模式 SHALL 顯示比雙換行更多的視覺間距

#### Scenario: Four or more line breaks render proportionally

- **WHEN** 使用者在編輯模式輸入四個或更多連續換行
- **THEN** 檢視模式 SHALL 顯示與換行數量成比例的視覺間距

### Requirement: Comment display preserves line breaks

CommentItem 的留言顯示 SHALL 套用與 MarkdownEditor View mode 相同的換行保留邏輯。

#### Scenario: Comment with line breaks

- **WHEN** 留言內容包含單行換行或連續空白行
- **THEN** 留言顯示 SHALL 保留所有換行，行為與 MarkdownEditor View mode 一致

### Requirement: Fenced code blocks are visually distinct

多行程式碼區塊（fenced code block, `pre`）SHALL 在檢視模式與 Rich 編輯模式中，透過背景色、邊框及文字顏色與周圍內容產生明顯對比，淺色與暗色主題皆須適用。

#### Scenario: Code block in light theme

- **WHEN** 應用程式處於淺色主題，且內容包含 fenced code block
- **THEN** 程式碼區塊 SHALL 顯示有別於頁面背景的深色背景、可見邊框，以及與正文不同的文字顏色

#### Scenario: Code block in dark theme

- **WHEN** 應用程式處於暗色主題，且內容包含 fenced code block
- **THEN** 程式碼區塊 SHALL 顯示有別於頁面背景的背景色、可見邊框，以及與正文不同的文字顏色

#### Scenario: Code block in Rich editor

- **WHEN** 使用者在 Rich 編輯模式中插入 fenced code block
- **THEN** 程式碼區塊的樣式 SHALL 與檢視模式一致（背景、邊框、文字顏色）
