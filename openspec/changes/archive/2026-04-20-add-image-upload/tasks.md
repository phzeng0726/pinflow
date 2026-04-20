## 1. Backend — 依賴與目錄初始化

- [x] 1.1 `backend/go.mod` — 加入 `github.com/chai2010/webp` 與 `golang.org/x/image` 依賴，執行 `go mod tidy`
- [x] 1.2 `backend/store/store.go` — `New()` 中加入 `os.MkdirAll(filepath.Join(basePath, "boards", fmt.Sprintf("board-%d", id), "images"), 0755)` 的 Board 建立 hook，確保 images 目錄隨 Board 建立

## 2. Backend — ImageService

- [x] 2.1 新增 `backend/dto/image_dto.go` — 定義 `ImageUploadResponse { URL string }`
- [x] 2.2 新增 `backend/service/image_service.go` — 定義 `ImageService` interface（Upload、BoardImageDir、CleanupImages、CleanupOrphanedImages、ReconcileBoardImages）
- [x] 2.3 實作 `imageService.Upload()` — 驗證檔案大小（≤5MB）、驗證格式（http.DetectContentType + 副檔名）、SVG 直接儲存、其他格式 image.Decode → webp.Encode（Quality:75, Lossless:false）→ 存為 `{uuid}.webp`
- [x] 2.4 實作 `imageService.CleanupImages()` — regex 提取 Markdown 中 `/api/v1/boards/(\d+)/images/([a-f0-9-]+\.(webp|svg))` 的本地圖片，刪除對應檔案（失敗僅 log）
- [x] 2.5 在 `image_service.go` 加入必要 blank imports：`image/gif`、`image/jpeg`、`image/png`、`golang.org/x/image/bmp`、`golang.org/x/image/webp`（用於 image.Decode 支援各格式）

## 3. Backend — ImageHandler 與 Router

- [x] 3.1 新增 `backend/api/image_handler.go` — `UploadImage` handler（`POST /api/v1/cards/:id/images`）含 Swagger godoc
- [x] 3.2 實作 `ServeImage` handler（`GET /api/v1/boards/:id/images/:filename`）— 驗證 filename 格式（`^[a-f0-9-]+\.(webp|svg)$`）防 path traversal，`c.File()` 提供檔案
- [x] 3.3 修改 `backend/api/router.go` — `RouterDeps` 加 `ImageH`；`cards` group 加 `POST /:id/images`；`boards` group 加 `GET /:id/images/:filename`；設定 `r.MaxMultipartMemory = 5 << 20`
- [x] 3.4 修改 `backend/main.go` — 建立 `ImageService`（傳入 cardRepo、columnRepo、basePath）及 `ImageHandler`，加入 `NewRouter` 參數

## 4. Backend — 刪除時圖片清理

- [x] 4.1 修改 `backend/service/card_service.go` — 加入 `imageSvc ImageService` 欄位；`DeleteCard` 先 `FindDetail` 收集 description + 所有 comment text，呼叫 `imageSvc.CleanupImages()`
- [x] 4.2 修改 `backend/service/comment_service.go` — 加入 `imageSvc ImageService` 欄位；`DeleteComment` 先取 `comment.Text`，呼叫 `imageSvc.CleanupImages()`
- [x] 4.3 執行 `cd backend && go build ./...` 確認後端編譯無誤
- [x] 4.4 執行 `cd backend && swag init` 更新 Swagger 文件

## 5. Frontend — API 層

- [x] 5.1 新增 `frontend/src/lib/api/images.ts` — `uploadImage(cardId, file)` 函式，以 FormData POST 至 `/cards/{cardId}/images`，覆寫 Content-Type 為 multipart/form-data
- [x] 5.2 修改 `frontend/src/lib/api/index.ts` — 加入 `export * from './images'`

## 6. Frontend — Lexical ImageNode

- [x] 6.1 新增 `frontend/src/components/common/markdown-editor/nodes/ImageNode.tsx` — 自訂 `DecoratorNode`，屬性 `__src`、`__altText`；`isInline()` 回傳 false
- [x] 6.2 實作 `ImageNode.decorate()` — 回傳 `<ImageComponent>`，blob: URL 時顯示 loading overlay（spinner + 半透明遮罩），載入失敗時顯示 broken image fallback
- [x] 6.3 實作 `ImageNode.importDOM()` — 處理 `<img>` HTML 標籤貼上，remote src 保留原始 URL 不上傳
- [x] 6.4 匯出 helper functions：`$createImageNode(src, altText)`、`$isImageNode(node)`

## 7. Frontend — Markdown Transformer

- [x] 7.1 新增 `frontend/src/components/common/markdown-editor/transformers/image.ts` — 兩個 transformer：`IMAGE_ELEMENT`（ElementTransformer，負責 export 與獨立一行的 import，blob: URL export 回傳空字串）；`IMAGE_TEXT`（TextMatchTransformer，負責段落內嵌圖片的 import）
- [x] 7.2 新增 `frontend/src/components/common/markdown-editor/transformers/index.ts` — `export const EDITOR_TRANSFORMERS = [...TRANSFORMERS, IMAGE]`

## 8. Frontend — ImagePlugin（Rich 模式）

- [x] 8.1 新增 `frontend/src/components/common/markdown-editor/plugins/ImagePlugin.tsx` — 定義並匯出 `INSERT_IMAGE_COMMAND` 與 `insertImageFromFile(editor, cardId, file)` 共用 helper
- [x] 8.2 實作 `insertImageFromFile`：驗證大小/格式 → `URL.createObjectURL` → 插入 blob ImageNode → `uploadImage(cardId, file)` → 成功時 `node.setSrc(url)` → 失敗時 `node.remove()` + toast error → `URL.revokeObjectURL()`
- [x] 8.3 在 `ImagePlugin` 中註冊 `PASTE_COMMAND` handler（`COMMAND_PRIORITY_HIGH`）：clipboardData.files 有圖片時呼叫 `insertImageFromFile` 並 return true
- [x] 8.4 在 `ImagePlugin` 中註冊 `DROP_COMMAND` handler：dataTransfer.files 有圖片時呼叫 `insertImageFromFile` 並 return true

## 9. Frontend — Source 模式圖片貼上

- [x] 9.1 新增 `frontend/src/components/common/markdown-editor/plugins/SourceImagePastePlugin.tsx` — 接受 `cardId` prop
- [x] 9.2 在 `SourceImagePastePlugin` 中註冊 `PASTE_COMMAND` 與 `DROP_COMMAND` handler：有圖片時驗證大小/格式 → 顯示 toast "Uploading..." → `uploadImage(cardId, file)` → 成功時在游標位置插入 `![image](url)\n` 純文字 → 失敗時 toast error

## 10. Frontend — ToolbarPlugin 圖片按鈕

- [x] 10.1 修改 `frontend/src/components/common/markdown-editor/plugins/ToolbarPlugin.tsx` — 加入 `cardId` prop
- [x] 10.2 在工具列加入圖片上傳按鈕（`Image` lucide icon）+ hidden `<input type="file" accept="image/*" ref>`；`onMouseDown` 觸發 `fileInputRef.current?.click()`
- [x] 10.3 在 file input `onChange` 中取得選擇的 File，呼叫 `insertImageFromFile(editor, cardId, file)`

## 11. Frontend — 編輯器整合

- [x] 11.1 修改 `frontend/src/components/common/markdown-editor/plugins/OnChangePlugin.tsx` — `TRANSFORMERS` → `EDITOR_TRANSFORMERS`
- [x] 11.2 修改 `frontend/src/components/common/markdown-editor/plugins/InitialValuePlugin.tsx` — `TRANSFORMERS` → `EDITOR_TRANSFORMERS`
- [x] 11.3 修改 `frontend/src/components/common/markdown-editor/plugins/index.ts` — 加入 export `ImagePlugin`、`SourceImagePastePlugin`
- [x] 11.4 修改 `frontend/src/components/common/markdown-editor/index.tsx` — Props 加 `cardId?: number`；`RICH_NODES` 加 `ImageNode`；所有 `TRANSFORMERS` → `EDITOR_TRANSFORMERS`；Rich 模式加 `<ImagePlugin cardId={cardId} />`；Source 模式加 `<SourceImagePastePlugin cardId={cardId} />`；`ToolbarPlugin` 傳入 `cardId`；`richInitialConfig` 的 `editorState` 改用 `EDITOR_TRANSFORMERS`；`MarkdownShortcutPlugin` 改用 `EDITOR_TRANSFORMERS`

## 12. Frontend — 呼叫端傳入 cardId

- [x] 12.1 修改 `frontend/src/pages/board-detail/components/cards/CardDetailDialog.tsx` — description 的 `<MarkdownEditor>` 加入 `cardId={card.id}`
- [x] 12.2 修改 `frontend/src/pages/board-detail/components/comments/CommentSection.tsx` — 新增留言的 `<MarkdownEditor>` 加入 `cardId={cardId}`
- [x] 12.3 修改 `frontend/src/pages/board-detail/components/comments/CommentItem.tsx` — 編輯留言的 `<MarkdownEditor>` 加入 `cardId={cardId}`

## 13. Frontend — 樣式與 i18n

- [x] 13.1 修改 `frontend/src/index.css` — 加入 `.markdown-preview img, .markdown-editor-content img { @apply my-2 max-w-full rounded; }`
- [x] 13.2 修改 `frontend/src/locales/zh-TW.json` — `toolbar` 加入 `"image": "插入圖片"`、`"imageSizeError": "圖片大小不得超過 5 MB"`、`"imageUploadError": "圖片上傳失敗"`
- [x] 13.3 修改 `frontend/src/locales/en-US.json` — `toolbar` 加入 `"image": "Insert Image"`、`"imageSizeError": "Image must be less than 5 MB"`、`"imageUploadError": "Failed to upload image"`

## 14. 驗證

- [x] 14.1 執行 `cd frontend && pnpm build` 確認前端編譯無誤
- [x] 14.2 手動測試：Rich 模式 Ctrl+V 貼上截圖 → 確認圖片顯示並上傳
- [x] 14.3 手動測試：工具列按鈕選擇圖片 → 確認上傳並插入
- [x] 14.4 手動測試：Source 模式貼上圖片 → 確認插入 `![image](url)` 文字
- [x] 14.5 手動測試：切換 Source ↔ Rich ↔ View → 確認圖片在三種模式正確顯示
- [x] 14.6 手動測試：刪除含圖片的卡片 → 確認 `workspace/boards/board-N/images/` 中對應檔案被清除
- [x] 14.7 手動測試：上傳 >5MB 圖片 → 確認顯示錯誤訊息
