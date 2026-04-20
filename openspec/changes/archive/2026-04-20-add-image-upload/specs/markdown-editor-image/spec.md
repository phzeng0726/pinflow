## ADDED Requirements

### Requirement: MarkdownEditor 支援從剪貼簿貼上圖片

系統 SHALL 在 `MarkdownEditor` 的 Rich 模式與 Source 模式中，攔截含有圖片的 paste 事件（Ctrl+V），自動上傳圖片並插入至編輯器內容中。`MarkdownEditor` SHALL 接受新增的 `cardId` prop 以決定上傳目標。

#### Scenario: Rich 模式 Ctrl+V 貼上截圖

- **WHEN** 使用者在 Rich 模式的 MarkdownEditor 中按下 Ctrl+V，且剪貼簿中包含圖片資料
- **THEN** 圖片立即以 blob URL 顯示（帶 loading overlay），同時非同步上傳至後端；上傳完成後 loading overlay 消失，圖片以最終 URL 持續顯示

#### Scenario: Source 模式 Ctrl+V 貼上截圖

- **WHEN** 使用者在 Source 模式的 MarkdownEditor 中按下 Ctrl+V，且剪貼簿中包含圖片資料
- **THEN** 圖片上傳完成後，在游標位置插入 `![image](url)` 格式的 Markdown 文字

#### Scenario: 圖片超過 5 MB 顯示錯誤

- **WHEN** 使用者嘗試貼上大於 5 MB 的圖片
- **THEN** 顯示錯誤提示訊息，圖片不被上傳也不被插入

#### Scenario: 上傳失敗時移除圖片佔位符

- **WHEN** 圖片上傳過程中發生錯誤
- **THEN** 編輯器移除 loading 中的圖片佔位符，並顯示錯誤提示訊息

### Requirement: MarkdownEditor 支援拖放圖片

系統 SHALL 在 `MarkdownEditor` 的 Rich 模式與 Source 模式中，支援拖放（drag-and-drop）圖片至編輯器內容區域來上傳並插入圖片。

#### Scenario: Rich 模式拖放圖片

- **WHEN** 使用者將圖片檔案拖放至 Rich 模式的編輯器內容區域
- **THEN** 行為與 Ctrl+V 貼上相同：立即顯示 loading 圖片，上傳完成後呈現最終圖片

#### Scenario: Source 模式拖放圖片

- **WHEN** 使用者將圖片檔案拖放至 Source 模式的編輯器內容區域
- **THEN** 上傳完成後在游標位置插入 `![image](url)` Markdown 文字

### Requirement: MarkdownEditor 工具列提供圖片上傳按鈕

系統 SHALL 在 Rich 模式工具列加入圖片上傳按鈕，點擊後開啟系統檔案選擇器，選擇的圖片 SHALL 自動上傳並插入至編輯器。

#### Scenario: 點擊工具列圖片按鈕選擇本地圖片

- **WHEN** 使用者點擊工具列的圖片按鈕並在檔案選擇器中選擇有效圖片
- **THEN** 圖片以與 Ctrl+V 相同的流程上傳並插入至編輯器

#### Scenario: 點擊工具列圖片按鈕但取消選擇

- **WHEN** 使用者點擊工具列圖片按鈕後關閉檔案選擇器而不選擇任何檔案
- **THEN** 編輯器狀態不變，無任何上傳或插入動作

### Requirement: MarkdownEditor Rich 模式以 ImageNode 顯示圖片

系統 SHALL 在 Rich 模式中使用自訂 Lexical `ImageNode`（DecoratorNode）以 block-level 方式在編輯器內直接顯示圖片。ImageNode SHALL 支援 Markdown `![alt](url)` 語法的雙向轉換（import/export）。

Markdown 轉換 SHALL 使用兩個 Transformer 協同處理：

- **`IMAGE_ELEMENT`（ElementTransformer）** — 處理 export 與獨立一行的 import（`^!\[…\]\(…\)\s*$`）。`DecoratorNode` 的 export 必須透過 `ElementTransformer` 觸發，`TextMatchTransformer.export()` 僅作用於 `ElementNode` 的 children，無法 export top-level `DecoratorNode`。export 時若 src 為 `blob:` 前綴，回傳空字串以防止上傳中的 blob URL 被存入後端。
- **`IMAGE_TEXT`（TextMatchTransformer）** — 處理段落文字中內嵌的 `![alt](url)` 語法（非獨立一行的情況）的 import。

#### Scenario: 圖片在 Rich 模式顯示

- **WHEN** 使用者切換至 Rich 模式且 Markdown 內容包含 `![alt](url)` 圖片語法
- **THEN** 圖片以 block-level `<img>` 元素在編輯器中實際顯示，而非顯示原始 Markdown 文字

#### Scenario: Rich 模式圖片匯出為 Markdown

- **WHEN** 使用者在 Rich 模式編輯後觸發 onChange
- **THEN** 圖片節點被匯出為 `![altText](url)` Markdown 語法

#### Scenario: blob URL 不被匯出

- **WHEN** 圖片仍在上傳中（src 為 blob: URL）且編輯器觸發 onChange
- **THEN** 該圖片節點 NOT 被匯出為 Markdown（避免將 blob URL 存入後端）

### Requirement: MarkdownEditor View 模式渲染圖片

系統 SHALL 在 View 模式（非編輯狀態）中，透過既有的 `react-markdown` 渲染 Markdown 內容中的 `![alt](url)` 圖片語法，圖片 SHALL 以適當的樣式顯示（最大寬度不超出容器、圓角）。

#### Scenario: View 模式顯示本地圖片

- **WHEN** description 或 comment 的 Markdown 包含本地圖片 URL（`/api/v1/boards/N/images/uuid.webp`）
- **THEN** View 模式正確顯示圖片，不顯示原始 Markdown 語法

#### Scenario: View 模式顯示遠端圖片

- **WHEN** description 或 comment 的 Markdown 包含遠端圖片 URL（`https://...`）
- **THEN** View 模式正確顯示該遠端圖片

### Requirement: MarkdownEditor 貼上含圖片的 HTML 時正確處理圖片

系統 SHALL 在 Rich 模式中，當使用者從其他應用程式複製含 `<img>` 標籤的 HTML 並貼上時，正確解析圖片元素並插入 ImageNode。遠端 `src` SHALL 保留原始 URL，不觸發上傳。

#### Scenario: 貼上含遠端圖片的 HTML

- **WHEN** 使用者從網頁複製含圖片的內容並貼上至 Rich 模式編輯器
- **THEN** 圖片以遠端 URL 直接插入為 ImageNode，不觸發上傳流程
