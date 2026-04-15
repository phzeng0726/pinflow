## 1. CommentSection — Create 區

- [x] 1.1 移除 `textareaRef`、`<Textarea>` import 及手動 `setTimeout focus` 邏輯
- [x] 1.2 將展開後的 `<Textarea>` 替換為 `<MarkdownEditor value={newText} onChange={setNewText} onBlur={() => setIsEditing(false)} placeholder={...} />`
- [x] 1.3 保留 Save 按鈕上的 `onMouseDown preventDefault`（防止 blur 觸發 `isEditing(false)` 收合編輯區）

## 2. CommentItem — Edit 區

- [x] 2.1 將 edit 模式的 `<Textarea>` 替換為 `<MarkdownEditor value={editText} onChange={setEditText} onBlur={handleCancel} />`（blur 時取消編輯並還原文字）
- [x] 2.2 移除 edit 區的 `rows`、`autoFocus`、`className="resize-none"` 等 textarea 專屬 props

## 3. CommentItem — 顯示區

- [x] 3.1 將 `<p className="whitespace-pre-wrap text-sm">{comment.text}</p>` 改為 `<ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.text}</ReactMarkdown>`
- [x] 3.2 加上 `prose prose-sm dark:prose-invert max-w-none` class 包裝 ReactMarkdown

## 4. 清理 import

- [x] 4.1 移除 `CommentSection.tsx` 中的 `Textarea` import
- [x] 4.2 新增 `MarkdownEditor` import（`@/components/ui/markdown-editor`）
- [x] 4.3 新增 `ReactMarkdown` 與 `remarkGfm` import（`react-markdown`、`remark-gfm`）
