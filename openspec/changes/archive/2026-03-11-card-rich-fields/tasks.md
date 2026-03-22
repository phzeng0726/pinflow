## 1. Backend: Data Models

- [x] 1.1 Create `model/tag.go` with `Tag` struct (ID, Name unique) and `CardTag` join struct
- [x] 1.2 Add `Tags []Tag` (many-to-many), `StartTime *time.Time`, `EndTime *time.Time` to `model/card.go`
- [x] 1.3 Create `model/checklist.go` with `Checklist` struct (ID, CardID, Title)
- [x] 1.4 Create `model/checklist_item.go` with `ChecklistItem` struct (ID, ChecklistID, Text, Completed bool, Position float64)
- [x] 1.5 Register all new models in GORM AutoMigrate in `main.go` or `database.go`

## 2. Backend: DTOs

- [x] 2.1 Create `dto/tag_dto.go` with `TagRequest`, `TagResponse`
- [x] 2.2 Create `dto/checklist_dto.go` with `ChecklistRequest`, `ChecklistResponse`, `ChecklistItemRequest`, `ChecklistItemResponse` (include CompletedCount/TotalCount)
- [x] 2.3 Update `CardResponse` in `dto/card_dto.go` to include `Tags`, `StartTime`, `EndTime`, `Checklists`
- [x] 2.4 Update `UpdateCardRequest` to include `StartTime *time.Time`, `EndTime *time.Time`

## 3. Backend: Repository Layer

- [x] 3.1 Create `repository/tag_repository.go` with CreateOrGet, ListAll, AttachToCard, DetachFromCard, ListByCard
- [x] 3.2 Create `repository/checklist_repository.go` with Create, ListByCard, Delete
- [x] 3.3 Create `repository/checklist_item_repository.go` with Create, Update, Delete, ListByChecklist
- [x] 3.4 Update card repository to preload Tags, StartTime, EndTime, Checklists+Items on GetByID

## 4. Backend: Service Layer

- [x] 4.1 Create `service/tag_service.go` with CreateOrGet, ListAll, AttachToCard, DetachFromCard
- [x] 4.2 Create `service/checklist_service.go` with CreateChecklist, DeleteChecklist, CreateItem, UpdateItem, DeleteItem
- [x] 4.3 Update `CardService.UpdateCard` to handle schedule fields with end_time > start_time validation

## 5. Backend: API Handlers & Routes

- [x] 5.1 Create `api/tag_handler.go` with handlers: POST /api/tags, GET /api/tags, POST /api/cards/:id/tags, DELETE /api/cards/:id/tags/:tagId
- [x] 5.2 Create `api/checklist_handler.go` with handlers: GET /api/cards/:id/checklists, POST /api/cards/:id/checklists, DELETE /api/checklists/:id
- [x] 5.3 Create `api/checklist_item_handler.go` with handlers: POST /api/checklists/:id/items, PATCH /api/checklist-items/:id, DELETE /api/checklist-items/:id
- [x] 5.4 Register all new routes in `api/router.go`
- [x] 5.5 Run `swag init` in `backend/` to regenerate Swagger docs

## 6. Backend: Tests

- [x] 6.1 Write repository tests for tag create/attach/detach
- [x] 6.2 Write service tests for schedule validation (end < start → error)
- [x] 6.3 Write handler tests for checklist CRUD endpoints

## 7. Frontend: TypeScript Types

- [x] 7.1 Update `src/types/index.ts` to add `Tag`, `Checklist`, `ChecklistItem` types
- [x] 7.2 Update `Card` type to include `tags`, `start_time`, `end_time`, `checklists`

## 8. Frontend: API Hooks

- [x] 8.1 Add tag API functions to `src/lib/api.ts` (createTag, listTags, attachTag, detachTag)
- [x] 8.2 Add checklist API functions (createChecklist, deleteChecklist, createItem, updateItem, deleteItem)
- [x] 8.3 Create `src/hooks/useTags.ts` with TanStack Query hooks for tags
- [x] 8.4 Create `src/hooks/useChecklists.ts` with hooks for checklist mutations

## 9. Frontend: Card Detail Dialog

- [x] 9.1 Create `src/features/card/CardDetailDialog.tsx` shell with Dialog (shadcn/ui or custom modal)
- [x] 9.2 Add title/description display (read-only or inline-edit) in dialog
- [x] 9.3 Implement tag section: display tag chips, tag search/create input, remove button
- [x] 9.4 Implement schedule section: datetime pickers for start_time and end_time with save button
- [x] 9.5 Implement checklist section: list checklists with items, completion toggles, text editing, delete buttons
- [x] 9.6 Implement "Add checklist" button with title input
- [x] 9.7 Implement "Add item" per checklist with text input
- [x] 9.8 Wire all mutations with optimistic updates using TanStack Query

## 10. Frontend: Board Integration

- [x] 10.1 Add a detail trigger (icon or clickable title) to the board card component to open `CardDetailDialog`
- [x] 10.2 Show tag chips on board card summary view (limited display, e.g., max 3 tags)
- [x] 10.3 Show schedule indicator on board card if start_time or end_time is set
- [x] 10.4 Show checklist progress bar/count on board card if checklists exist

## 11. Frontend: Tests

- [x] 11.1 Write tests for `CardDetailDialog` rendering and tag interaction
- [x] 11.2 Write tests for checklist item toggle mutation
