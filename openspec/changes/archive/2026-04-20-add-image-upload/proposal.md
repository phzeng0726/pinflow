## Why

卡片的 description 和 comment 目前只支援純文字與 Markdown 語法，無法嵌入圖片，限制了卡片內容的表達能力。加入圖片上傳功能可讓使用者直接在卡片內嵌入截圖或說明圖，不需依賴外部圖床。

## What Changes

- 新增後端圖片上傳端點：`POST /api/v1/cards/:id/images`，接受 multipart/form-data，轉換為 WebP，儲存於 `boards/board-N/images/`
- 新增後端圖片提供端點：`GET /api/v1/boards/:id/images/:filename`，提供儲存的圖片檔案
- 圖片以 Board 層級儲存於 `workspace/boards/board-N/images/`（WebP 格式；SVG 直接通過不轉換）
- 刪除卡片或留言時，後端自動掃描 Markdown 內容並清理對應的本地圖片檔案
- 刪除 Board 時，整個 `board-N/` 資料夾連同 images 一起刪除，不需額外清理邏輯
- 前端 `MarkdownEditor` 新增圖片支援：從剪貼簿貼上（Ctrl+V）、拖放、工具列上傳按鈕
- Rich 模式：自訂 Lexical `ImageNode` 在編輯器內直接顯示圖片，上傳中顯示 loading overlay
- Source 模式：圖片貼上/拖放完成上傳後，插入 `![image](url)` 純文字
- View 模式（react-markdown）：已可透過 `![alt](url)` 語法渲染，無需變更
- `MarkdownEditor` 新增 `cardId` prop，用於決定上傳至哪個 Board 的目錄
- 遠端圖片連結（如 `https://...`）保留原始 URL，不下載不轉換
- 大小限制：每張圖片 5 MB
- Go 依賴：`github.com/chai2010/webp`（與 Peacock 專案一致）

## Capabilities

### New Capabilities

- `image-upload`：後端圖片儲存、上傳 API、WebP 轉換、Board 層級檔案配置、刪除卡片/留言時自動清理圖片
- `markdown-editor-image`：前端 `MarkdownEditor` 圖片支援 — Lexical ImageNode、貼上/拖放/工具列上傳流程、上傳 API 整合

### Modified Capabilities

（無 — 現有 `markdown-editor` 與 `card-comments` spec 的需求無須異動，圖片支援為新增功能）

## Impact

**後端**
- 新增 Go 依賴：`github.com/chai2010/webp`、`golang.org/x/image`
- 新增檔案：`dto/image_dto.go`、`service/image_service.go`、`api/image_handler.go`
- 修改檔案：`api/router.go`、`main.go`、`service/card_service.go`、`service/comment_service.go`
- Workspace 目錄：每個 Board 新增 `boards/board-N/images/` 子目錄

**前端**
- 新增檔案：`lib/api/images.ts`、`nodes/ImageNode.tsx`、`transformers/image.ts`、`transformers/index.ts`、`plugins/ImagePlugin.tsx`、`plugins/SourceImagePastePlugin.tsx`
- 修改檔案：`markdown-editor/index.tsx`、`ToolbarPlugin.tsx`、`OnChangePlugin.tsx`、`InitialValuePlugin.tsx`、`plugins/index.ts`、`lib/api/index.ts`、`index.css`、locale 檔案、`CardDetailDialog.tsx`、`CommentSection.tsx`、`CommentItem.tsx`

**API**
- `POST /api/v1/cards/:id/images`
- `GET /api/v1/boards/:id/images/:filename`
