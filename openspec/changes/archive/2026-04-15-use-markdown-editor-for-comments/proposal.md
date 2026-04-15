## Why

Comment 的輸入框目前使用純文字 `<textarea>`，而 description 已改用 `MarkdownEditor`，造成同一個 card detail dialog 內輸入體驗不一致。將 comment 的 create 與 edit 輸入框統一改用 `MarkdownEditor`，讓格式化功能貫穿整個 card detail。

## What Changes

- `CommentSection`（create 區）：將展開後的 `<Textarea>` 替換為 `MarkdownEditor`；移除 `textareaRef` 與手動 focus 邏輯
- `CommentItem`（edit 區）：將編輯模式的 `<Textarea>` 替換為 `MarkdownEditor`，`editText` state 改由 editor `onChange` 驅動
- comment 的顯示（`<p className="whitespace-pre-wrap">`）改為 Markdown 渲染（使用 `react-markdown`，與 description 顯示方式一致）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `card-comments`：comment 的 create/edit 輸入改為支援 Markdown 格式（使用 `MarkdownEditor`），comment 顯示改為 Markdown 渲染

## Impact

- `frontend/src/pages/board-detail/components/comments/CommentSection.tsx`：主要修改檔案
- `frontend/src/components/ui/markdown-editor/index.tsx`：直接引用，不需修改
- 無 API / backend 變更
