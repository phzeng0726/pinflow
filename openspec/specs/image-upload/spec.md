# Spec: Image Upload

## Purpose

定義後端圖片上傳與存取的功能規格，包含圖片格式轉換、儲存位置、路徑安全性，以及與卡片和留言刪除時的自動清理行為。

## Requirements

### Requirement: 後端接受圖片上傳並轉換為 WebP 儲存

系統 SHALL 提供 `POST /api/v1/cards/:id/images` 端點，接受 multipart/form-data 格式的圖片上傳，將圖片轉換為 WebP 格式後儲存至對應 Board 的 images 目錄，並回傳可存取的圖片 URL。SVG 檔案 SHALL 直接儲存，不進行格式轉換。

#### Scenario: 上傳有效圖片（PNG/JPEG/GIF/BMP/WebP）

- **WHEN** 用戶端以 multipart/form-data 傳送有效圖片檔案至 `POST /api/v1/cards/:id/images`
- **THEN** 系統回傳 HTTP 201，body 包含 `{ "url": "/api/v1/boards/{boardId}/images/{uuid}.webp" }`，且圖片已轉換並儲存為 WebP 格式

#### Scenario: 上傳 SVG 不轉換

- **WHEN** 用戶端上傳 SVG 圖片至 `POST /api/v1/cards/:id/images`
- **THEN** 系統回傳 HTTP 201，body 包含 `{ "url": "/api/v1/boards/{boardId}/images/{uuid}.svg" }`，且檔案以原始 SVG 格式儲存（不轉換）

#### Scenario: 圖片超過 5 MB 限制

- **WHEN** 用戶端上傳大小超過 5 MB 的圖片
- **THEN** 系統回傳 HTTP 400 錯誤

#### Scenario: 非圖片格式被拒絕

- **WHEN** 用戶端上傳非圖片格式的檔案（如 .txt、.pdf）
- **THEN** 系統回傳 HTTP 400 錯誤

#### Scenario: 無效 card ID 被拒絕

- **WHEN** 用戶端上傳圖片至不存在的 card ID
- **THEN** 系統回傳 HTTP 404 錯誤

### Requirement: 後端提供圖片檔案存取

系統 SHALL 提供 `GET /api/v1/boards/:id/images/:filename` 端點，從 workspace 的 Board images 目錄提供圖片檔案。端點 SHALL 驗證 filename 格式以防止 path traversal 攻擊。

#### Scenario: 存取已上傳的圖片

- **WHEN** 用戶端發送 `GET /api/v1/boards/{boardId}/images/{uuid}.webp` 請求
- **THEN** 系統回傳 HTTP 200 及對應的 WebP 圖片內容

#### Scenario: 存取不存在的圖片

- **WHEN** 用戶端請求不存在的圖片 filename
- **THEN** 系統回傳 HTTP 404 錯誤

#### Scenario: 惡意 filename 被拒絕（Path Traversal 防護）

- **WHEN** 用戶端請求包含路徑分隔符的 filename（如 `../etc/passwd`）
- **THEN** 系統回傳 HTTP 400 錯誤，不嘗試存取對應路徑

### Requirement: 圖片以 Board 層級儲存

系統 SHALL 將圖片儲存於 `workspace/boards/board-{id}/images/` 目錄，每張圖片使用 UUID 作為檔名。系統 SHALL 在 Board 目錄建立時自動建立 images 子目錄。

#### Scenario: 圖片儲存於正確 Board 目錄

- **WHEN** 上傳圖片至屬於 board-3 的某張卡片
- **THEN** 圖片儲存於 `workspace/boards/board-3/images/{uuid}.webp`

#### Scenario: 刪除 Board 時圖片一同刪除

- **WHEN** 用戶端刪除一個含有圖片的 Board
- **THEN** 整個 `boards/board-N/` 資料夾（含 images 子目錄）被刪除，不需額外清理邏輯

### Requirement: ImageService 介面

`ImageService` interface SHALL 提供以下方法：

- `Upload(cardID, fileHeader)` — 驗證並儲存圖片，回傳 URL 路徑
- `BoardImageDir(boardID)` — 回傳指定 Board 的 images 目錄絕對路徑
- `CleanupImages(markdown)` — 掃描 markdown，刪除所有引用的本地圖片檔
- `CleanupOrphanedImages(oldMarkdown, newMarkdown)` — 刪除 oldMarkdown 中有、newMarkdown 中無的本地圖片（用於更新 card/comment 時清理不再引用的圖片）
- `ReconcileBoardImages(cardID)` — 掃描 Board 全部 Markdown 內容，刪除 images 目錄中未被任何 card/comment 引用的孤立檔案

### Requirement: 刪除卡片或留言時自動清理引用的圖片

系統 SHALL 在刪除卡片或留言時，掃描其 Markdown 內容中的本地圖片 URL（符合 `/api/v1/boards/\d+/images/[a-f0-9-]+\.(webp|svg)` 格式），並刪除對應的圖片檔案。清理失敗 SHALL 記錄 log 但不影響刪除操作本身。

#### Scenario: 刪除含圖片的卡片時清理圖片

- **WHEN** 用戶端刪除一張在 description 或 comment 中包含本地圖片 URL 的卡片
- **THEN** 卡片被成功刪除（HTTP 204），且對應的圖片檔案從 `workspace/boards/board-N/images/` 中刪除

#### Scenario: 刪除含圖片的留言時清理圖片

- **WHEN** 用戶端刪除一則包含本地圖片 URL 的留言
- **THEN** 留言被成功刪除（HTTP 204），且對應的圖片檔案被刪除

#### Scenario: 遠端圖片 URL 不受影響

- **WHEN** 卡片 description 包含遠端圖片 URL（如 `![img](https://example.com/img.png)`）且卡片被刪除
- **THEN** 卡片正常刪除，遠端 URL 不被處理（不嘗試下載或刪除）
