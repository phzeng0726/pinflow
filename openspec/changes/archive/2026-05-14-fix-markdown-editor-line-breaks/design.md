## Context

MarkdownEditor 的 View mode 使用 `ReactMarkdown` + `remark-gfm` 渲染使用者輸入的 Markdown 文字。Source 模式的 `SourcePlugin` 以 `join('\n')` 輸出段落文字，每次 Enter 產生一個 `\n`。然而標準 Markdown 將單個 `\n` 視為 soft break（渲染為空格），且折疊連續空白行為單一段落分隔，導致檢視模式的換行與使用者預期不符。

同樣的 ReactMarkdown 渲染也用於 `CommentItem.tsx` 的留言顯示，需同步修正。

## Goals / Non-Goals

**Goals:**

- 檢視模式忠實呈現使用者輸入的每一次換行
- 連續多次空白行產生對應比例的視覺間距
- 保持所有 Markdown 語法功能正常（標題、清單、程式碼區塊、引用等）
- 同步修正 CommentItem 的留言渲染

**Non-Goals:**

- 不修改 Source/Rich 編輯模式的行為（編輯中換行已正常）
- 不改變 Markdown 原始文字的儲存格式
- 不重寫 ReactMarkdown 渲染機制或換用其他 Markdown 渲染庫

## Decisions

### Decision 1: 使用 `remark-breaks` 處理單行換行

**選擇**: 安裝 `remark-breaks` remark 插件，加入 ReactMarkdown 的 `remarkPlugins` 陣列。

**替代方案**:
- 前處理文字，在每個 `\n` 前加上兩個空格（Markdown hard break 語法 `  \n`）：可行但會修改傳入的文字，且對 code block 內的換行造成副作用
- 使用 `white-space: pre-wrap` CSS：會影響所有 Markdown 元素的排版（標題、清單等），破壞格式

**理由**: `remark-breaks` 是 remark 生態系的標準插件，專門將 soft break 轉為 hard break，不影響其他 Markdown 語法的解析。

### Decision 2: 前處理函式 `preserveBlankLines` 保留連續空白行

**選擇**: 在傳入 ReactMarkdown 前，將連續空白行（`\n\n` 後額外的 `\n`）轉為含 NBSP（` `）的段落佔位。

**邏輯**: `\n\n` 是標準段落分隔（保留），超出的每個 `\n` 插入一個只含空白字元的行，使其成為獨立段落。

```
輸入: "hello\n\n\nworld"
處理: "hello\n\n \n\nworld"
渲染: <p>hello</p><p> </p><p>world</p> (兩段間隔)
```

**替代方案**:
- 使用 `rehype-raw` + 插入 `<br>` HTML 標籤：需額外依賴且開放 HTML 渲染（潛在安全考量）
- 自訂 remark plugin 處理段落間距：過度工程化，正規表達式前處理更簡單直接

**理由**: 純字串前處理不增加額外依賴，NBSP 是真實字元不需 HTML 解析，且不干擾 Markdown block-level 語法（標題、清單等都在非空白行上，不受影響）。

### Decision 3: 工具函式放在 markdown-editor/utils.ts

**選擇**: 在 `frontend/src/components/common/markdown-editor/utils.ts` 新建檔案，匯出 `preserveBlankLines` 函式。

**理由**: MarkdownEditor view mode 和 CommentItem 都需要此函式。放在 markdown-editor 目錄下符合功能歸屬，CommentItem 透過 `@/components/common/markdown-editor/utils` 引入。

## Risks / Trade-offs

- **NBSP 佔位段落有額外高度** → 段落間距由 CSS margin 決定，視覺上可能比編輯模式的空白行略大。可接受，使用者主要需求是「多行空白 = 更多間距」的比例關係，不需要 pixel-perfect 匹配。
- **Markdown 語法後的空白行行為** → `# Heading\n\ntext` 不受影響（只有兩個 `\n`，不觸發前處理）。`# Heading\n\n\ntext` 會在標題和段落間插入佔位段落，這是預期行為。
