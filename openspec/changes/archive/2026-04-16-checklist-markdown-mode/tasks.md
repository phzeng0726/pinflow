## 1. Backend — DTO

- [x] 1.1 在 `backend/dto/checklist_dto.go` 新增 `SyncChecklistItemsRequest` 與 `SyncChecklistItemEntry` struct

## 2. Backend — Repository

- [x] 2.1 在 `backend/repository/interfaces.go` 的 `ChecklistItemRepository` interface 新增 `SyncItems(checklistID uint, items []model.ChecklistItem) ([]model.ChecklistItem, error)`
- [x] 2.2 在 `backend/repository/file_checklist_item_repository.go` 實作 `SyncItems`：以 textPool map 做 smart diff（保留相同文字的既有 ID），重新指派 position（index + 1），呼叫 `s.UpdateCard` 寫回

## 3. Backend — Service

- [x] 3.1 在 `backend/service/checklist_service.go` 的 `ChecklistService` interface 新增 `SyncItems(checklistID uint, items []dto.SyncChecklistItemEntry) (*model.Checklist, error)`
- [x] 3.2 實作 `SyncItems`：驗證 checklist 存在 → 轉換 DTO → 呼叫 `itemRepo.SyncItems` → 以 `clRepo.FindByID` 回傳更新後的 checklist

## 4. Backend — Handler 與 Router

- [x] 4.1 在 `backend/api/checklist_item_handler.go` 新增 `SyncItems` handler（含 Swagger godoc）
- [x] 4.2 在 `backend/api/router.go` 的 checklists group 新增 `checklists.PUT("/:id/items", checklistItemH.SyncItems)`
- [x] 4.3 執行 `cd backend && swag init` 重新產生 Swagger docs

## 5. Frontend — API 與 Mutation

- [x] 5.1 在 `frontend/src/lib/api/checklists.ts` 新增 `syncChecklistItems(checklistId, items)` 函式（PUT 請求）
- [x] 5.2 在 `frontend/src/hooks/checklist/mutations/useChecklistMutations.ts` 新增 `syncItems` mutation，成功後 invalidate board detail + card detail，並加入 toast 通知

## 6. Frontend — Markdown 工具函式

- [x] 6.1 建立 `frontend/src/pages/board-detail/components/checklists/checklistMarkdown.ts`，實作 `itemsToMarkdown(items: ChecklistItem[]): string` 與 `markdownToItems(text: string): {text: string; completed: boolean}[]`

## 7. Frontend — ChecklistMarkdownEditor 元件

- [x] 7.1 建立 `frontend/src/pages/board-detail/components/checklists/ChecklistMarkdownEditor.tsx`
- [x] 7.2 實作初始化邏輯：以 `itemsToMarkdown(sortedItems)` 填入 textarea；空 checklist 預填 `- [ ] `
- [x] 7.3 實作 Enter 自動續行：`onKeyDown` 攔截 Enter，插入 `- [ ] ` 前綴；空前綴行按 Enter 移除該行
- [x] 7.4 實作 Save / Cancel 按鈕：Save 解析 markdown 並呼叫 `onSave`，Cancel 呼叫 `onCancel`

## 8. Frontend — ChecklistBlock 整合

- [x] 8.1 在 `frontend/src/pages/board-detail/components/checklists/ChecklistBlock.tsx` 新增 `markdownMode` state
- [x] 8.2 在 checklist header（L191 `flex items-center gap-2` 區域）新增切換按鈕（`FileText` icon）
- [x] 8.3 加入條件渲染：`markdownMode === false` 顯示現有 UI，`markdownMode === true` 顯示 `<ChecklistMarkdownEditor>`
- [x] 8.4 Wire `onSave` → `syncChecklistItems.mutate()`（成功後 `setMarkdownMode(false)`）與 `onCancel` → `setMarkdownMode(false)`

## 9. Frontend — i18n

- [x] 9.1 在 `frontend/src/locales/zh-TW.json` 的 `checklist` 區塊新增 `markdownMode`、`uiMode` 鍵；在 `toast.checklist` 區塊新增 `itemsSynced`、`itemsSyncError` 鍵
- [x] 9.2 在 `frontend/src/locales/en-US.json` 新增對應的英文翻譯

## 10. 驗證

- [x] 10.1 執行 `cd backend && go test ./... -v` 確認後端測試通過
- [x] 10.2 執行 `cd frontend && pnpm build` 確認前端編譯通過
- [x] 10.3 手動測試：開啟 card detail → checklist → 切換至 Markdown 模式 → 輸入多行（驗證 Enter 續行）→ 儲存 → 確認項目正確更新 → 切回 UI 模式驗證 DnD 正常
