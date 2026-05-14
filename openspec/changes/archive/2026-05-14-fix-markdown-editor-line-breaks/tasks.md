## 1. 依賴安裝

- [x] 1.1 在 `frontend/` 執行 `pnpm add remark-breaks` 安裝依賴

## 2. 工具函式

- [x] 2.1 新建 `frontend/src/components/common/markdown-editor/utils.ts`，匯出 `preserveBlankLines` 函式：將連續空白行（`\n\n` 後額外的 `\n`）轉為含 NBSP 的佔位段落

## 3. MarkdownEditor View mode 修正

- [x] 3.1 在 `frontend/src/components/common/markdown-editor/index.tsx` 引入 `remarkBreaks` 和 `preserveBlankLines`，更新 View mode 的 ReactMarkdown：`remarkPlugins={[remarkGfm, remarkBreaks]}` 並以 `preserveBlankLines(value)` 作為 children

## 4. CommentItem 修正

- [x] 4.1 在 `frontend/src/pages/board-detail/components/comments/CommentItem.tsx` 引入 `remarkBreaks` 和 `preserveBlankLines`，更新 ReactMarkdown 渲染：套用與 MarkdownEditor View mode 相同的設定

## 5. 多行程式碼區塊樣式改善

- [x] 5.1 更新 `frontend/src/index.css` 中 `.markdown-editor-content pre` 和 `.markdown-preview pre` 的樣式：加上邊框並調整背景色，提高與周圍內容的對比度（淺色 + 暗色主題）
- [x] 5.2 更新 `frontend/src/components/common/markdown-editor/index.tsx` 中 `RICH_THEME.code` 的 Tailwind class，與 CSS 樣式一致

## 6. 驗證

- [x] 6.1 執行 `pnpm build` 確認編譯無錯誤
- [x] 6.2 啟動 dev server，測試 MarkdownEditor 單行換行、多行空白行、Markdown 語法渲染
- [x] 6.3 測試 CommentItem 留言顯示換行行為
- [x] 6.4 測試多行程式碼區塊在淺色/暗色主題下的視覺效果
