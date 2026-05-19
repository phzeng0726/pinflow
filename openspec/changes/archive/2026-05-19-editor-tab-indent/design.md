## Context

MarkdownEditor 元件使用 Lexical 0.43.0，提供 Source（PlainTextPlugin）與 Rich（RichTextPlugin）兩種模式。另有 ChecklistMarkdownEditor 使用原生 `<textarea>`。三者皆未攔截 Tab 鍵，按下 Tab 時焦點直接移出編輯器。

## Goals / Non-Goals

**Goals:**

- Tab 鍵在所有編輯器模式中執行縮排（2 spaces / block indent）
- Shift+Tab 執行反向取消縮排
- 支援多行選取的批次縮排/取消縮排

**Non-Goals:**

- 不處理 Escape 鍵退出編輯器（現有 blur 機制已足夠）
- 不修改 Tab 的縮排單位（固定為 2 spaces）
- 不新增無障礙的 Tab-trap 脫離機制（使用者可透過滑鼠或模式切換按鈕離開編輯器）

## Decisions

### D1: Rich 模式使用官方 TabIndentationPlugin

**選擇：** 直接使用 `@lexical/react/LexicalTabIndentationPlugin`

**替代方案：** 自行註冊 `KEY_TAB_COMMAND` 手動 dispatch `INDENT_CONTENT_COMMAND`

**理由：** 官方 plugin 已安裝在 node_modules 中，行為完善（自動判斷 cursor 位置決定 indent block 或 insert tab character），與 ListPlugin、CheckListPlugin 整合良好。自建方案無額外收益。

### D2: Source 模式以自訂 SourceTabPlugin 插入空格字元

**選擇：** 新建 `SourceTabPlugin` 註冊 `KEY_TAB_COMMAND`，直接修改 TextNode 內容

**替代方案：** 使用 TabIndentationPlugin 的 `setIndent()` CSS 級縮排

**理由：** Source 模式的文字會原封不動匯出為 Markdown 字串。`setIndent()` 只改 DOM 外觀不改文字內容，匯出後不含縮排。必須在文字層級插入空格。

### D3: 縮排單位為 2 個空格

**選擇：** 固定 2 spaces

**理由：** Markdown 標準中巢狀列表需 2-4 空格縮排，2 spaces 最常見且與前端程式碼風格一致。

### D4: SourceTabPlugin 使用 COMMAND_PRIORITY_HIGH

**選擇：** 與 `SourceImagePastePlugin` 一致使用 `COMMAND_PRIORITY_HIGH`

**理由：** Source 模式和 Rich 模式使用不同的 `LexicalComposer` 實例，不會有優先級衝突。HIGH 確保 Tab 被攔截而非傳遞給瀏覽器。

## Risks / Trade-offs

- **Tab trap（無障礙）：** 攔截 Tab 後鍵盤使用者無法透過 Tab 離開編輯器 → 現有 blur-to-view 機制（點擊外部）和模式切換按鈕可作為替代。此為已知限制，官方 TabIndentationPlugin 文件亦有相同說明。
- **Lexical 自動調整 selection offset：** 修改 TextNode 內容後 Lexical 可能自動重設游標位置 → 需在實作中測試並視需要手動校正 anchor/focus offset。
- **空 paragraph 處理：** Source 模式中空行的 ParagraphNode 可能沒有 TextNode 子節點 → indent 時需建立新 TextNode，outdent 時 no-op。
