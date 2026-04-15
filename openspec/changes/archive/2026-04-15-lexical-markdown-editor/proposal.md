## Why

CardDetailDialog 的 Description 目前使用純文字 `<Textarea>`，無法進行格式化編輯，降低了卡片描述的可讀性與表達能力。引入 Lexical 富文本編輯器，讓使用者可以用 Markdown 語法撰寫帶格式的描述，同時保持後端儲存格式不變（純 Markdown 字串）。

## What Changes

- 在 `frontend/src/components/ui/` 新增可重用的 `MarkdownEditor` 元件（基於 Lexical）
- CardDetailDialog 的 Description 輸入區從 `<Textarea>` 替換為 `MarkdownEditor`
- 編輯器支援固定工具列，提供格式按鈕（H1-H3、粗體、斜體、行內程式碼、程式碼區塊、連結、無序清單、有序清單、Checkbox、分隔線、引用區塊）
- 支援 Markdown 快捷輸入（如 `# ` 轉標題、`**text**` 轉粗體、`` ` `` 轉行內程式碼、` ``` ` 轉程式碼區塊、`- [ ]` 轉 checkbox、`---` 轉分隔線、`> ` 轉引用區塊）
- 描述欄位繼續以 Markdown 字串儲存，後端 API 與型別定義無需修改
- Dark mode 相容

## Capabilities

### New Capabilities

- `markdown-editor`: 可重用的 Lexical Markdown 富文本編輯器元件，包含固定工具列與所有 Markdown 格式支援（標題、粗體、斜體、行內程式碼、程式碼區塊、連結、清單、checkbox、分隔線、引用區塊）

### Modified Capabilities

- `card-detail-dialog`: Description 欄位的編輯行為從純文字輸入升級為支援 Markdown 富文本編輯，需更新該 spec 中關於 description 的編輯需求

## Impact

- **新增依賴**: `lexical`, `@lexical/react`, `@lexical/markdown`, `@lexical/rich-text`, `@lexical/list`, `@lexical/link`, `@lexical/code`
- **修改檔案**:
  - `frontend/src/components/ui/markdown-editor/` (新增)
  - `frontend/src/pages/board-detail/components/cards/CardDetailDialog.tsx`
  - `frontend/src/index.css` (新增 editor content 樣式)
- **不影響**: 後端 API、資料模型、其他前端元件
