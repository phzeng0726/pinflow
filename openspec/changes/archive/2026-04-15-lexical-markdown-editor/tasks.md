## 1. 安裝套件

- [x] 1.1 在 `frontend/` 安裝 Lexical 相關套件：`lexical @lexical/react @lexical/markdown @lexical/rich-text @lexical/list @lexical/link @lexical/code`

## 2. 全域樣式

- [x] 2.1 在 `frontend/src/index.css` 新增 `@layer components` 區塊，定義 `.markdown-editor-content` 的內容樣式（h1-h3、ul/ol、code、pre、blockquote、a、hr、checkbox）
- [x] 2.2 補全 `.markdown-editor-content code` / `.markdown-editor-content pre` / `.markdown-editor-content pre code` 的 dark mode 樣式

## 3. 建立 MarkdownEditor 元件

- [x] 3.1 建立 `frontend/src/components/ui/markdown-editor/` 資料夾
- [x] 3.2 建立 `plugins.tsx`：實作 `SourcePlugin`（Source 模式，join 純文字行 → onChange）、`OnChangePlugin`（Rich 模式，`$convertToMarkdownString` → onChange，同步 `lastExportRef`）、`OnBlurPlugin`（偵測 blur → 呼叫 onBlur + switchToView）、`InitialValuePlugin`（比對 `lastExportRef`，只有外部真正變更時才 `$convertFromMarkdownString`）、`AutoFocusPlugin`
- [x] 3.3 建立 `ToolbarPlugin.tsx`：固定工具列，含標題下拉（H1/H2/H3/Normal）、粗體、斜體、行內程式碼、程式碼區塊、引用區塊、分隔線、連結、無序清單、有序清單、Checkbox 按鈕；使用 `onMouseDown` + `preventDefault()` 防止觸發 editor blur；active 狀態高亮
- [x] 3.4 建立 `index.tsx`：主元件 `MarkdownEditor`，view 模式（ReactMarkdown）+ edit 模式（Source / Rich 子模式切換）。Source 模式：`LexicalComposer` + `PlainTextPlugin` + 行號欄 + `SourcePlugin`。Rich 模式：`LexicalComposer`（含所有節點 + theme）+ `ToolbarPlugin` + `RichTextPlugin` + `MarkdownShortcutPlugin` + `ListPlugin` + `CheckListPlugin` + `LinkPlugin` + `HorizontalRulePlugin` + `OnChangePlugin` + `OnBlurPlugin` + `InitialValuePlugin` + `AutoFocusPlugin`

## 4. 整合至 CardDetailDialog

- [x] 4.1 在 `CardDetailDialog.tsx` 加入 `MarkdownEditor` import，移除 `Textarea` import（若已無其他使用）
- [x] 4.2 將 `useForm` 解構加入 `setValue` 與 `watch`，新增 `const descriptionValue = watch('description')`
- [x] 4.3 將 Description 區塊的 `<Textarea {...register('description')} ...>` 替換為 `<MarkdownEditor value={descriptionValue ?? ''} onChange={(md) => setValue('description', md, { shouldDirty: true })} onBlur={handleBlur} placeholder={t('cardDetail.descPlaceholder')} />`

## 5. 驗證

- [x] 5.1 開啟含 Markdown 描述的卡片，確認內容正確渲染（不顯示原始 Markdown 符號）
- [x] 5.2 測試所有工具列按鈕功能（標題、粗體、斜體、程式碼、引用、清單、checkbox、連結、分隔線）
- [x] 5.3 測試 Markdown 快捷輸入（`# `、`**`、`` ` ``、` ``` `、`> `、`- `、`1. `、`- [ ]`、`---`）
- [x] 5.4 點擊編輯器外部，確認 API 收到正確的 Markdown 字串（無不必要的 API 呼叫）
- [x] 5.5 切換 Dark mode，確認編輯器、工具列、內容樣式正確
- [x] 5.6 執行 `cd frontend && pnpm build` 確認編譯通過
