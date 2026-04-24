## Context

Source 模式的編輯區由 Lexical `ContentEditable` + 左側行號欄組成。行號欄每個 `<div class="source-editor-line">` 的高度與段落 `<p>` 的 `line-height: 1.5rem` 對齊。

目前問題根源：
1. `index.css`: `.markdown-source-editor p { whitespace-nowrap; }` — 強制不換行
2. `index.tsx:224`: `overflow-x-auto` — 提供橫向捲軸滿足不換行的溢出

## Goals / Non-Goals

**Goals:**
- Source 模式輸入長行時自動換行，不出現橫向捲軸
- 保留 `pre-wrap` 語義，使用者輸入的前導空格（縮排）被保留
- 超長連續字元（如長 URL）也能換行

**Non-Goals:**
- 不要求每條視覺行都有行號（邏輯行號即可，同 VSCode Word Wrap）
- 不修改 Rich 模式

## Decisions

### 使用 `white-space: pre-wrap` 而非 `break-all`

Markdown Source 常有前導空格（縮排）與 code fence，需保留空白。`pre-wrap` 保留空白但允許在邊界換行，比 `normal` 更符合 Markdown 語義。

`overflow-wrap: anywhere` 處理無空格的長 URL / token（比 `word-break: break-all` 更精準：只在必要時才切字）。

### 行號欄對齊策略

啟用換行後，行號欄（`lineCount` 來自 `SourcePlugin`）仍以邏輯行（`\n`）計算。一個長段落換行後視覺佔多行，左側只顯示一個行號（對齊第一視覺行）。此為 Word Wrap 的標準行為，無需修改行號計算邏輯。

## Risks / Trade-offs

- [縮排不對齊] `pre-wrap` 保留空白，但換行後續行不會有縮排；純 Markdown 環境下可接受
- [行號與內容視覺錯位] 長段落換行後行號只在頂端，無法精確指向中間視覺行 → 接受，屬 Word Wrap 標準取捨

## Migration Plan

純 CSS + JSX 修改，無資料遷移。更新後瀏覽器自動套用新樣式。
