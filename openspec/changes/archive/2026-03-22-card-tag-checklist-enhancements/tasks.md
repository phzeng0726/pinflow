## 1. Backend — Card Story Point

- [x] 1.1 Add `StoryPoint *int` field to Card model (`backend/model/card.go`)
- [x] 1.2 Add `story_point` to Card DTOs (request/response in `backend/dto/`)
- [x] 1.3 Update CardService and CardRepository to handle story_point in create/update
- [x] 1.4 Add validation: story_point must be positive integer or null
- [x] 1.5 Run `swag init` to regenerate Swagger docs
- [x] 1.6 Write tests for story_point CRUD (`backend/tests/`)

## 2. Backend — Tag Color + Edit + Delete

- [x] 2.1 Add `Color string` field to Tag model (`backend/model/tag.go`)
- [x] 2.2 Update Tag DTOs to include `color` field in request/response
- [x] 2.3 Update `CreateTag` service/handler to accept `color` parameter
- [x] 2.4 Add `UpdateTag` method to TagRepository (update name and/or color)
- [x] 2.5 Add `UpdateTag` method to TagService with unique name validation
- [x] 2.6 Add `PATCH /api/v1/tags/:id` handler with Swagger godoc
- [x] 2.7 Add `DeleteTag` method to TagRepository (cascade delete associations)
- [x] 2.8 Add `DeleteTag` method to TagService
- [x] 2.9 Add `DELETE /api/v1/tags/:id` handler with Swagger godoc
- [x] 2.10 Register new routes in `api/router.go`
- [x] 2.11 Run `swag init` to regenerate Swagger docs
- [x] 2.12 Write tests for tag update, delete, and color (`backend/tests/`)

## 3. Backend — Checklist Title Update

- [x] 3.1 Add `UpdateChecklist` method to ChecklistRepository (update title)
- [x] 3.2 Add `UpdateChecklist` method to ChecklistService with validation
- [x] 3.3 Add `PATCH /api/v1/checklists/:id` handler with Swagger godoc (extend existing delete handler file)
- [x] 3.4 Register new route in `api/router.go`
- [x] 3.5 Run `swag init` to regenerate Swagger docs
- [x] 3.6 Write tests for checklist title update (`backend/tests/`)

## 4. Frontend — Types & API Layer

- [x] 4.1 Update `Card` type in `types/index.ts`: add `story_point?: number | null`
- [x] 4.2 Update `Tag` type in `types/index.ts`: add `color: string`
- [x] 4.3 Add `updateTag(id, data)` and `deleteTag(id)` to `lib/api/tags.ts`
- [x] 4.4 Add `updateChecklist(id, data)` to `lib/api/checklists.ts`
- [x] 4.5 Update `index.ts` re-exports if needed

## 5. Frontend — Zod Schemas

- [x] 5.1 Add/update tag schema in `lib/schemas.ts` (name + color validation)
- [x] 5.2 Add checklist title update schema in `lib/schemas.ts`

## 6. Frontend — Query Hooks

- [x] 6.1 Add `updateTag` and `deleteTag` mutations to `useTagMutations.ts`
- [x] 6.2 Add `updateChecklist` mutation to `useChecklistMutations.ts`

## 7. Frontend — Story Point UI

- [x] 7.1 Create `StoryPointSelector` component (button group: 1,3,5,7,9,11,13,15,17,19 + clear button)
- [x] 7.2 Integrate `StoryPointSelector` into `CardDetailDialog`
- [x] 7.3 Display story point badge on `CardItem` in board view

## 8. Frontend — Tag Color & Management UI

- [x] 8.1 Create `ColorPicker` component (Tailwind color palette: red, orange, amber, yellow, lime, green, emerald, cyan, blue, violet, purple, pink)
- [x] 8.2 Integrate `ColorPicker` into tag creation flow (existing tag input in CardDetailDialog)
- [x] 8.3 Create tag edit dialog/popover with name + color editing
- [x] 8.4 Add delete tag action with confirmation dialog
- [x] 8.5 Update tag display everywhere to show color (CardItem tags, CardDetailDialog tags)

## 9. Frontend — Checklist Title Editing

- [x] 9.1 Make checklist title inline-editable in `ChecklistBlock` (click to edit, Enter/blur to save, Escape to cancel)

## 10. Integration Testing

- [x] 10.1 Verify backend builds: `cd backend && go build ./...`
- [x] 10.2 Run backend tests: `cd backend && go test ./... -v`
- [x] 10.3 Verify frontend builds: `cd frontend && pnpm build`
- [x] 10.4 Run frontend tests: `cd frontend && pnpm test`
