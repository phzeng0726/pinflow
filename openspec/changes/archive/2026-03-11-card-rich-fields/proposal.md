## Why

Cards currently only support a title and description, which limits their usefulness as planning tools. Users need richer metadata—tags for categorization, time ranges for scheduling, and checklists with subtasks for tracking granular progress.

## What Changes

- Add **tags** field to cards (many-to-many, user-defined labels)
- Add **startTime** and **endTime** datetime fields to cards
- Add **Checklist** entity (a card can have multiple checklists)
- Add **ChecklistItem** (subtask) entity under each checklist, with completion toggle
- Add a **Card Detail Dialog** in the frontend for viewing/editing all rich fields
- Backend: new DB tables, REST endpoints, and DTO updates for all new entities

## Capabilities

### New Capabilities

- `card-tags`: Tagging cards with user-defined labels (many-to-many); create, list, attach/detach tags
- `card-schedule`: Start/end datetime fields on cards; set and clear scheduling info
- `card-checklist`: Create checklists on a card; add, reorder, delete checklist items (subtasks) with completion state
- `card-detail-dialog`: Frontend dialog UI for editing all card rich fields (tags, schedule, checklists)

### Modified Capabilities

- `card-management`: Card model and CRUD now includes tags, startTime, endTime; card response DTO expanded

## Impact

- **Backend**: `model/card.go` (new fields + associations), new `model/tag.go`, `model/checklist.go`, `model/checklist_item.go`; new repository and service layers; new API routes under `/api/cards/:id/tags`, `/api/cards/:id/checklists`, `/api/checklists/:id/items`
- **Frontend**: updated `Card` TypeScript type; new API hooks; `CardDetailDialog` component; updates to card display in board/pin views
- **DB**: auto-migrated new tables (`tags`, `card_tags` join, `checklists`, `checklist_items`)
- **Swagger**: regenerate docs after handler changes
