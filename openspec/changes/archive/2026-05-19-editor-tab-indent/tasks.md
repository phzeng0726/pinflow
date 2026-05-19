## 1. Rich 模式 — TabIndentationPlugin

- [x] 1.1 在 `markdown-editor/index.tsx` 中 import `TabIndentationPlugin` from `@lexical/react/LexicalTabIndentationPlugin`，並在 Rich 模式的 `<LexicalComposer>` 內加入 `<TabIndentationPlugin />`

## 2. Source 模式 — SourceTabPlugin

- [x] 2.1 新建 `plugins/SourceTabPlugin.tsx`：註冊 `KEY_TAB_COMMAND`（`COMMAND_PRIORITY_HIGH`），Tab 在所有選取行的行首插入 2 spaces，Shift+Tab 移除行首最多 2 spaces，支援多行選取與空行處理
- [x] 2.2 在 `plugins/index.ts` 新增 `export { SourceTabPlugin } from './SourceTabPlugin'`
- [x] 2.3 在 `markdown-editor/index.tsx` Source 模式的 `<LexicalComposer>` 內加入 `<SourceTabPlugin />`

## 3. Checklist Textarea — handleKeyDown 擴充

- [x] 3.1 ~~在 `ChecklistMarkdownEditor.tsx` 的 `handleKeyDown` 中加入 Tab/Shift+Tab 處理~~ — 不需要，僅 MarkdownEditor 需要縮排功能

## 4. 驗證

- [x] 4.1 執行 `pnpm build` 確認編譯通過
- [x] 4.2 啟動 dev server 手動測試三種模式的 Tab/Shift+Tab 縮排行為
