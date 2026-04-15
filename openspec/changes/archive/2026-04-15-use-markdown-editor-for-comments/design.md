## Context

`CommentSection.tsx` 包含兩個輸入場景：
1. **Create**：點擊 placeholder 展開後顯示 `<Textarea>`，blur 時收合
2. **Edit**（`CommentItem`）：點擊 Edit 按鈕後顯示 `<Textarea>`，Save/Cancel 結束

Description 已使用 `MarkdownEditor`（`@/components/ui/markdown-editor`），且 `react-markdown` + `remarkGfm` 已安裝。`MarkdownEditor` 的 `onBlur` 不會在點擊 toolbar 按鈕時觸發，故可安全替換 textarea。

## Goals / Non-Goals

**Goals:**
- 將 create 與 edit 的 `<Textarea>` 替換為 `<MarkdownEditor>`
- 將 comment 顯示從 `<p className="whitespace-pre-wrap">` 改為 `<ReactMarkdown>` 渲染

**Non-Goals:**
- 不修改 `MarkdownEditor` 元件本身
- 不變更 API / 後端：comment 的 `text` 欄位仍為純字串，現在存的是 Markdown 字串
- 不處理歷史 comment 的純文字升級（既有 comment 直接用 ReactMarkdown 渲染，純文字段落可正常顯示）

## Decisions

### 1. Create 區的收合行為保留，改用 MarkdownEditor 的 onBlur

**決定**：保留 `isEditing` state 控制展開/收合，展開後渲染 `MarkdownEditor` 並傳入 `onBlur={() => setIsEditing(false)}`。Save 按鈕保留 `onMouseDown={(e) => e.preventDefault()}` 以防止點擊 Save 時觸發 blur 導致編輯區提前收合。

**理由**：MarkdownEditor 的 `onBlur` 已正確排除 toolbar 點擊（用 `onMouseDown + preventDefault`），所以收合行為不受影響。移除 `textareaRef` 與手動 `setTimeout focus`，由 MarkdownEditor 內部的 `AutoFocusPlugin` 負責 focus。

**替代方案考慮**：讓 create 區像 description 一樣常駐不收合 → 不符合目前的留言 UX 設計。

### 2. Edit 區直接換成 MarkdownEditor，不需 onBlur

**決定**：`CommentItem` 的 edit 模式移除 `<Textarea>`，改用 `<MarkdownEditor value={editText} onChange={setEditText} onBlur={handleCancel} />`。Save 按鈕加上 `onMouseDown={(e) => e.preventDefault()}` 防止點擊 Save 時觸發 blur 取消編輯。

**理由**：blur-to-cancel 提供與其他 inline editor 一致的 UX（點擊其他地方放棄編輯）。Save 按鈕的 `onMouseDown` 確保點擊 Save 不會提前觸發 blur。

### 3. 顯示使用 ReactMarkdown + remarkGfm

**決定**：將 `<p className="whitespace-pre-wrap">{comment.text}</p>` 改為 `<ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.text}</ReactMarkdown>`，套用與 markdown-editor 一致的 `prose` Tailwind class。

**理由**：`react-markdown` 已安裝，與 MarkdownEditor 的 view-mode 使用相同套件，渲染風格一致。

## Risks / Trade-offs

- **歷史純文字 comment**：直接用 ReactMarkdown 渲染，純文字段落可正常顯示，不需 migration。若舊資料含 `#` 等特殊字元，可能被誤解析為 Markdown。風險極低，可接受。
- **MarkdownEditor 高度**：editor 預設最小高度可能大於原本 `rows={3}` 的 textarea，視覺上略有差異 → 無需額外處理，MarkdownEditor 已有合理預設。
