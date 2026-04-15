## Context

CardDetailDialog 的 Description 欄位目前使用 `<Textarea>`（純文字輸入），無法表達格式化內容。後端以 `string` 型別儲存 description，透過 `PATCH /cards/:id` 更新。前端使用 `react-hook-form` + `onBlur` 觸發儲存。

目標是在不改動後端 API、資料模型的前提下，引入 Lexical 富文本編輯器，讓使用者可在 CardDetailDialog 中以 Markdown 格式撰寫描述。

## Goals / Non-Goals

**Goals:**
- 以 Lexical 取代 CardDetailDialog 的 Description `<Textarea>`
- 支援格式：H1-H3、粗體、斜體、行內程式碼、程式碼區塊、引用區塊、連結、無序清單、有序清單、Checkbox（`- [x]`）、分隔線
- 提供固定工具列（編輯器上方一排格式按鈕）
- 支援 Markdown 快捷輸入（輸入 `# `、`**`、`` ` ``、`> ` 等自動轉換）
- 保持 onBlur 儲存行為，description 以 Markdown 字串儲存
- Dark mode 相容

**Non-Goals:**
- 不修改後端 API 或資料模型
- 不支援底線（標準 Markdown 無對應語法）
- 不支援圖片插入
- 不實作協作編輯或 conflict resolution
- `MarkdownEditor` 不需要支援 CardDetailDialog 以外的使用場景（但設計為可重用元件）

## Decisions

### 1. 使用 Lexical 而非 TipTap / Slate

**決定**: 使用 `lexical` + `@lexical/react`

**理由**: Lexical 是 Meta 開源的編輯器框架，plugin 架構清晰、bundle size 較小、與 React 整合完整。TipTap 雖然 API 更高階，但核心依賴 ProseMirror，授權與 bundle 較重。Slate 維護活躍度較低。

### 2. 儲存格式：Markdown 字串

**決定**: 匯出/匯入皆使用 Markdown 字串（`@lexical/markdown` 的 `$convertToMarkdownString` / `$convertFromMarkdownString`）

**理由**: 後端已使用 `string` 儲存 description，無需 migration。Markdown 字串人類可讀，Git-syncable workspace 格式友善。Lexical JSON state 雖更完整，但會綁定前端版本，且破壞現有資料。

**取捨**: Markdown round-trip 不完全（部分複雜巢狀格式可能失真），但對 kanban 卡片描述的使用場景是可接受的。

### 3. Toolbar：固定工具列

**決定**: 在 ContentEditable 上方渲染固定工具列

**理由**: Block-level 操作（標題、清單、引用）需要游標在區塊內觸發，浮動工具列不適用。固定工具列更直覺、一目瞭然。

### 4. 工具列按鈕防 blur

**決定**: 工具列按鈕使用 `onMouseDown` + `event.preventDefault()` 而非 `onClick`

**理由**: 點擊按鈕會觸發 ContentEditable 的 blur，導致提前儲存且游標位置遺失。`onMouseDown` + `preventDefault()` 可保持 editor focus。

### 5. react-hook-form 整合：controlled pattern

**決定**: 不用 `register()`，改用 `watch('description')` + `setValue('description', md)`

**理由**: Lexical 的 ContentEditable 是 `div[contenteditable]`，不是原生 input，無法直接 register。用 watch/setValue 可保持 RHF 管理 form state，blur 時 handleSubmit 正常執行。

### 6. 初始值同步策略

**決定**: 用 ref 記錄「最後一次 export 的 markdown」，只有當外部 `value` prop 與 ref 不同時，才重新 import

**理由**: 避免每次 react-query refetch 後重新 import markdown 導致游標跳回開頭。Save 後 refetch 帶回的值與 ref 相同，不觸發重新 import。

### 7. Checkbox 支援

**決定**: 使用 `@lexical/list` 的 `ListItemNode` 搭配 `CHECK` 清單類型，加上自訂 Markdown transformer 處理 `- [ ]` / `- [x]`

**理由**: `@lexical/list` 原生支援 CHECK 類型，`@lexical/markdown` 的預設 TRANSFORMERS 包含 `CHECK_LIST` transformer。

### 8. 兩種編輯模式並存，透過 toggle 切換

**決定**: 在 edit 模式中提供 **Source**（純文字 markdown 源碼 + 行號欄）與 **Rich**（Lexical WYSIWYG + ToolbarPlugin）兩種子模式，預設為 Source，切換按鈕顯示於 editor 容器右上角。

**理由**: 純文字 source editor 適合熟悉 Markdown 的使用者快速輸入；Rich 模式提供工具列與格式快捷，對不熟悉 Markdown 語法的使用者更友善。onBlur 切回 view 模式（ReactMarkdown 渲染）的行為不變，使用者可直接確認排版結果，無需額外「預覽」按鈕。

**切換時的 value 同步**:
- Source → Rich：Rich editor 透過 `initialConfig.editorState` 以當前 `value` 執行 `$convertFromMarkdownString` 初始化；`lastExportRef` 在切換前同步為 `value`，避免 `InitialValuePlugin` 誤觸發重新 import。
- Rich → Source：Source editor 的 `initialConfig.editorState` 逐行建立 ParagraphNode；`lineCount` 亦在切換前以 `value.split('\n').length` 重置。

**防 blur 策略**: 切換按鈕使用 `onMouseDown` + `preventDefault()`，避免點擊時觸發 ContentEditable blur → view 模式切換。

## Risks / Trade-offs

- **Markdown round-trip 失真** → 對卡片描述場景可接受；實作後需以現有資料測試
- **工具列點擊 blur 問題** → 以 `onMouseDown` + `preventDefault()` 緩解
- **bundle size 增加** → Lexical 約 +80KB gzip；對 Electron 應用可接受
- **`@lexical/code` syntax highlight** → 預設不含語言偵測，僅提供等寬字型樣式；足夠現有需求

## Migration Plan

無 schema migration。現有純文字 description 字串匯入 Lexical 時會被解析為純文字段落，不會造成資料損毀。儲存後仍為合法 Markdown 字串。無需 rollback 機制。
