## Why

在 MarkdownEditor（Source / Rich 模式）與 ChecklistMarkdownEditor 中，按下 Tab 鍵時瀏覽器預設行為會將焦點移出編輯器，無法進行文字縮排。對於撰寫巢狀列表、程式碼區塊或結構化 Markdown 的使用者而言，這是基本的編輯體驗缺口。

## What Changes

- Rich 模式加入 Lexical 官方 `TabIndentationPlugin`，支援 Tab 縮排段落/列表項目、Shift+Tab 取消縮排
- Source 模式新增自訂 `SourceTabPlugin`，Tab 在行首插入 2 個空格、Shift+Tab 移除行首最多 2 個空格，支援多行選取
- ChecklistMarkdownEditor（原生 textarea）擴充 `handleKeyDown`，加入相同的 Tab/Shift+Tab 縮排邏輯

## Capabilities

### New Capabilities

- `editor-tab-indent`: 涵蓋 Tab/Shift+Tab 在三種編輯器模式中的縮排與取消縮排行為

### Modified Capabilities

- `markdown-editor`: 新增 Tab 鍵縮排相關的需求場景（Source 模式插入空格、Rich 模式 block-level indent）

## Impact

- **Frontend 元件：** `MarkdownEditor`（source + rich）、`ChecklistMarkdownEditor`
- **新增檔案：** `frontend/src/components/common/markdown-editor/plugins/SourceTabPlugin.tsx`
- **修改檔案：** `markdown-editor/index.tsx`、`plugins/index.ts`、`ChecklistMarkdownEditor.tsx`
- **依賴：** 無需安裝新套件，`@lexical/react/LexicalTabIndentationPlugin` 已在 node_modules 中
