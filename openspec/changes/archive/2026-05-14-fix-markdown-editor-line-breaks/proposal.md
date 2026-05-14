## Why

MarkdownEditor 的檢視模式（View mode）使用 ReactMarkdown + remark-gfm 渲染，遵循標準 Markdown 規範：單個 `\n` 被視為 soft break 渲染成空格，連續多個空白行被折疊成一個段落分隔。這導致使用者在編輯模式中正常換行的內容，切換到檢視模式後換行全部消失、多行內容被壓縮，嚴重影響閱讀體驗。

## What Changes

- 新增 `remark-breaks` 依賴，讓 ReactMarkdown 將單個 `\n` 渲染為 `<br>`（hard break），而非空格
- 新增 `preserveBlankLines` 前處理函式，將連續空白行轉為含佔位字元的段落，防止 Markdown 折疊多個換行
- 更新 MarkdownEditor 的 View mode 渲染，套用上述兩項修正
- 更新 CommentItem 的留言顯示，套用相同修正（使用相同的 ReactMarkdown 渲染邏輯）

## Capabilities

### New Capabilities

（無新增 capability）

### Modified Capabilities

- `markdown-editor`: 新增檢視模式的換行保留需求 — View mode 須忠實呈現使用者輸入的換行，包含單次換行與連續多次空白行

## Impact

- **前端依賴**: 新增 `remark-breaks` npm 套件
- **受影響檔案**:
  - `frontend/src/components/common/markdown-editor/index.tsx` — View mode ReactMarkdown 設定
  - `frontend/src/components/common/markdown-editor/utils.ts` — 新增前處理工具函式
  - `frontend/src/pages/board-detail/components/comments/CommentItem.tsx` — 留言渲染
- **無後端變更**: 不影響 API 或資料格式，markdown 原始文字存儲不變
