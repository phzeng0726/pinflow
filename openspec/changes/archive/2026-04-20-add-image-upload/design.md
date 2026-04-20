## Context

目前 PinFlow 的 card description 和 comment 以純 Markdown 字串儲存，使用 Lexical 編輯器（Source/Rich 雙模式）編輯，react-markdown 渲染。後端以 JSON 檔案儲存卡片資料於 workspace 目錄。前端與後端目前完全沒有圖片/檔案上傳的基礎建設。

相關的參考實作：Peacock 專案已使用 `github.com/chai2010/webp` 完成 WebP 轉換，模式可直接沿用。

## Goals / Non-Goals

**Goals:**
- 支援在 description 和 comment 的編輯器中貼上、拖放、選擇圖片並上傳
- 後端接收圖片後轉 WebP 儲存（SVG 直接儲存）
- 圖片以 Board 層級管理，刪除 Board 時自動清理
- 刪除含圖片的卡片或留言時，自動清理引用的圖片檔案

**Non-Goals:**
- 不支援下載或轉換遠端圖片連結（保留原始 URL）
- 不支援圖片大小調整（resize）
- 不支援跨 Board 搬卡片時自動搬移圖片（URL 仍指向原 Board，繼續有效）
- 不支援 Animated GIF（image.Decode 只取第一幀）

## Decisions

### 決策 1：圖片儲存路徑 — Board 層級

**選擇**：`workspace/boards/board-N/images/{uuid}.webp`

**理由**：
- 刪除 Board 時整個資料夾一起刪除，不需額外掃描清理圖片
- 符合既有的階層結構（board → columns → cards）
- Git-syncable：相關內容集中於同一 Board 資料夾

**替代方案**：全域 `workspace/images/` — 較簡單，但刪除 Board 時需額外邏輯清理

### 決策 2：WebP 編碼套件 — chai2010/webp

**選擇**：`github.com/chai2010/webp`

**理由**：Peacock 專案已驗證可在 Windows 上正常使用（含 CGO）；模式已熟悉，可直接沿用。

**替代方案**：`gen2brain/webp`（純 Go / wazero）— 不需 CGO，但需額外驗證 Windows 相容性。

### 決策 3：上傳 API 以 card ID 為參數

**選擇**：`POST /api/v1/cards/:id/images`

**理由**：
- 前端呼叫時始終知道 card ID（MarkdownEditor 只在既有卡片的 CardDetailDialog / Comment 中使用）
- 後端由 card → column → board 反查 board ID，自動決定存放路徑，前端無需傳 board ID

**替代方案**：`POST /api/v1/boards/:id/images` — 前端需自行取得 board ID，增加耦合。

### 決策 4：圖片 URL 格式含 Board ID

**選擇**：`/api/v1/boards/{boardId}/images/{uuid}.webp`

**理由**：
- 直接映射到實體儲存路徑，serve 端點實作簡單
- 即使卡片搬到其他 Board，舊 URL 仍繼續有效（圖片不隨卡片搬移）

### 決策 5：Rich 模式使用 Lexical DecoratorNode

**選擇**：自訂 `ImageNode extends DecoratorNode`

**理由**：
- Lexical 官方建議 block-level 媒體元素使用 `DecoratorNode`
- `importDOM()` 可處理 HTML 貼上時的 `<img>` 標籤
- `decorate()` 回傳 React 元件，可實作 loading overlay

### 決策 6：Source 模式上傳完成後才插入文字

**選擇**：等待上傳完成，再插入 `![image](url)` 純文字

**理由**：Source 模式使用 PlainTextPlugin，文字替換邏輯複雜。上傳至本地後端很快（<1 秒），loading 期間顯示 toast 通知即可。

### 決策 7：圖片清理策略 — 刪除時主動掃描

**選擇**：刪除 card/comment 時，掃描 Markdown 內容提取本地圖片 URL 並刪除檔案

**理由**：
- 最直觀，無需額外索引或引用計數表
- Board 刪除由資料夾刪除自動處理，不需掃描

**Trade-off**：同一圖片若被複製到兩個 card，刪除其中一個時圖片會消失。這是可接受的邊緣情況。

## Risks / Trade-offs

- **CGO 依賴**：`chai2010/webp` 需要 C compiler（MinGW）。若未來需要在無 C compiler 的環境打包，須改用純 Go 方案。→ 已在 Peacock 驗證可用，短期風險低。

- **Blob URL 匯出**：Rich 模式上傳中，editor onChange 可能匯出含 `blob:` URL 的 Markdown 並觸發自動存檔。→ ImageNode 的 TextMatchTransformer export 過濾 `blob:` 前綴的 src，回傳空字串避免存入。

- **OnBlur 時上傳中**：使用者可能在圖片上傳期間離開編輯器，editor unmount 後 callback 無法操作已銷毀的 editor。→ upload callback 先檢查 `editor.isDisposed()`，若已銷毀則僅記錄 log，不操作 editor。

- **SVG 的 Content-Type 辨識**：`http.DetectContentType()` 讀取前 512 bytes，SVG 為 XML 文字開頭，可能被辨識為 `text/xml` 而非 `image/svg+xml`。→ 同時檢查副檔名（`.svg`）作為輔助判斷。

- **跨 Board 搬卡片後的孤立圖片**：卡片搬到其他 Board 後，圖片仍在原 Board 的 images 目錄，刪除原 Board 時圖片也會消失。→ 設計上已接受此行為（圖片 URL 仍有效直到刪除 Board）。

## Open Questions

_（無）_
