## ADDED Requirements

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
