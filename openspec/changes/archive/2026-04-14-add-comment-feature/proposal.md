## Why

CardDetailDialog 目前缺乏留言功能，無法在卡片上記錄討論或備註。同時為了為未來多人協作打基礎，需要在 workspace 層級引入身份識別機制（workspaceId），讓每則留言都能追蹤其來源。

## What Changes

- `manifest.json` 新增 `workspaceId` 欄位（UUID，首次建立 workspace 時自動生成）
- 新增 Comment 資料模型，嵌入 card JSON 檔案（與 Checklist 相同策略）
- Comment 記錄 `authorId`（即 workspaceId），後端建立時自動帶入，前端不需傳遞
- CardDetailDialog 改為左右分割佈局，右側新增 CommentSection
- CommentSection 支援新增、編輯（inline）、刪除（popover 確認）留言
- 前端目前不顯示作者，但 `authorId` 欄位保留供未來擴展

## Capabilities

### New Capabilities
- `card-comments`: 卡片留言 CRUD，含後端 API、資料儲存（嵌入 card JSON）、前端 CommentSection 元件
- `workspace-identity`: Workspace 層級的身份識別，`manifest.json` 儲存自動生成的 `workspaceId`，供留言作者追蹤使用

### Modified Capabilities
- `card-detail-dialog`: Dialog 從單欄改為左右分割佈局，右側加入 CommentSection；寬度從 `max-w-2xl` 擴展為 `max-w-4xl`

## Impact

- **Backend**：`manifest.json` schema 變更（加 workspaceId）、CardFile 加 Comments 欄位、新增 comment 相關 model/repo/service/handler/routes、`swag init` 需重跑
- **Frontend**：`Card` type 加 `comments` 欄位、新增 comments API client 與 mutation hook、新增 CommentSection 元件、CardDetailDialog 佈局調整
- **Storage**：現有 card JSON 檔案向下相容（`comments` 欄位缺失時視為空陣列）
