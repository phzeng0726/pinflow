## Why

Checklist 項目目前只能透過「新增項目」按鈕逐一建立，大量輸入時費時費力。Markdown 編輯模式讓使用者可以直接輸入或貼上多行 `- [ ] 項目` 語法，大幅提升 checklist 管理效率。

## What Changes

- 新增 `PUT /api/v1/checklists/:id/items` endpoint，接受 `[{text, completed}]` 並以智慧 diff 同步項目（文字相同者保留既有 ID，新增者建立，消失者刪除）
- 每個 checklist 區塊 header 新增 Markdown 模式切換按鈕
- 新增專用 `ChecklistMarkdownEditor` 元件 — 具備自動續行功能的 textarea（在 `- [ ] 文字` 後按 Enter 自動插入下一個 `- [ ] ` 前綴；在空前綴行按 Enter 則結束輸入）
- 使用者可隨時在 Markdown 模式與原本的 UI 模式（DnD、inline 編輯、checkbox、刪除）之間切換

## Capabilities

### New Capabilities

- `checklist-markdown-mode`：Checklist 項目的 Markdown 編輯模式，包含專用 editor UX、後端同步 endpoint，以及智慧 diff 邏輯

### Modified Capabilities

_（無 — 現有 checklist-dnd spec 的需求不變）_

## Impact

- **Backend**：`backend/dto/checklist_dto.go`、`backend/repository/interfaces.go`、`backend/repository/file_checklist_item_repository.go`、`backend/service/checklist_service.go`、`backend/api/checklist_item_handler.go`、`backend/api/router.go`
- **Frontend**：`frontend/src/lib/api/checklists.ts`、`frontend/src/hooks/checklist/mutations/useChecklistMutations.ts`、新增 `checklistMarkdown.ts` 與 `ChecklistMarkdownEditor.tsx`、修改 `ChecklistBlock.tsx`
- **i18n**：`frontend/src/locales/zh-TW.json` 與 `en-US.json`
- **不影響**現有 checklist item 的單筆 CRUD endpoint
