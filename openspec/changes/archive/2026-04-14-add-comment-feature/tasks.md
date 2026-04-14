## 1. Backend — Workspace Identity

- [x] 1.1 在 `backend/store/store.go` 的 `Manifest` struct 新增 `WorkspaceID string` 欄位
- [x] 1.2 在 `store.New()` 載入 manifest 後，若 `WorkspaceID` 為空則呼叫 `uuid.New().String()` 生成並寫回 manifest
- [x] 1.3 在 `FileStore` 加入 `WorkspaceID() string` 方法供外部取用

## 2. Backend — Comment Model & Storage

- [x] 2.1 新增 `backend/model/comment.go`，定義 `Comment` struct（ID, CardID, Text, AuthorID, CreatedAt, UpdatedAt）
- [x] 2.2 在 `backend/model/card.go` 的 `Card` struct 加入 `Comments []Comment`
- [x] 2.3 在 `backend/store/store.go` 的 `CardFile` struct 加入 `Comments []model.Comment`
- [x] 2.4 在 `FileStore` 加入 `commentToCard map[uint]uint` 反向索引
- [x] 2.5 更新 `loadCard()` 時建立 `commentToCard` 索引；更新 `deleteCard()` 時清除索引
- [x] 2.6 新增 `CardIDForComment(commentID uint) (uint, bool)` 方法

## 3. Backend — DTO

- [x] 3.1 新增 `backend/dto/comment_dto.go`，定義 `CreateCommentRequest`、`UpdateCommentRequest`、`CommentResponse`
- [x] 3.2 在 `backend/dto/card_dto.go` 的 `CardResponse` 加入 `Comments []CommentResponse`
- [x] 3.3 在 card service 的 `ToCardResponse()` 中填入 comments（從 card.Comments 轉換）

## 4. Backend — Repository

- [x] 4.1 在 `backend/repository/interfaces.go` 新增 `CommentRepository` interface（Create, FindByID, ListByCard, Update, Delete）
- [x] 4.2 新增 `backend/repository/file_comment_repository.go`，實作上述 interface（依循 `file_checklist_repository.go` 模式）

## 5. Backend — Service

- [x] 5.1 新增 `backend/service/comment_service.go`，定義 `CommentService` interface 與實作（CreateComment, ListByCard, UpdateComment, DeleteComment）
- [x] 5.2 `CreateComment` 從 `FileStore.WorkspaceID()` 取得 authorId，不從 request 接收

## 6. Backend — Handler & Router

- [x] 6.1 新增 `backend/api/comment_handler.go`，含 Swagger godoc（POST /cards/:id/comments、PATCH /comments/:id、DELETE /comments/:id）
- [x] 6.2 在 `backend/api/router.go` 註冊三條 comment 路由
- [x] 6.3 在 `backend/main.go` 初始化並 wire `commentRepo`、`commentSvc`、`commentH`
- [x] 6.4 執行 `cd backend && swag init` 更新 Swagger 文件

## 7. Frontend — Types & API Client

- [x] 7.1 在 `frontend/src/types/index.ts` 新增 `Comment` interface（id, cardId, text, authorId, createdAt, updatedAt）
- [x] 7.2 在 `Card` interface 加入 `comments: Comment[]`
- [x] 7.3 新增 `frontend/src/lib/api/comments.ts`（createComment, updateComment, deleteComment）
- [x] 7.4 在 `frontend/src/lib/api/index.ts` re-export comments API

## 8. Frontend — Mutation Hook

- [x] 8.1 新增 `frontend/src/hooks/comment/mutations/useCommentMutations.ts`，提供 `create`、`update`、`remove` mutations
- [x] 8.2 每個 mutation 成功後 invalidate `queryKeys.cardDetail(cardId)`

## 9. Frontend — CommentSection Component

- [x] 9.1 新增 `frontend/src/pages/board-detail/components/comments/CommentSection.tsx`
- [x] 9.2 實作頂部輸入區：textarea（placeholder "Write a comment..."）+ Save 按鈕，空白不送出
- [x] 9.3 實作留言列表：依 `createdAt` 降冪排列，每則顯示文字卡片 + 頁尾（相對時間 • Edit • Delete）
- [x] 9.4 實作 Edit inline 模式：點 Edit 後以 textarea 取代文字，顯示 Save / Cancel
- [x] 9.5 實作 Delete Popover 確認：點 Delete 展開 Popover，含確認刪除與取消按鈕

## 10. Frontend — CardDetailDialog 佈局調整

- [x] 10.1 將 `CardDetailDialog.tsx` 的 `max-w-2xl` 改為 `max-w-4xl`
- [x] 10.2 主內容區改為 `flex flex-row`，左側 `flex-1 overflow-y-auto`，右側固定寬度 `border-l`
- [x] 10.3 在右側加入 `<CommentSection cardId={card.id} comments={card.comments} boardId={boardId} />`
