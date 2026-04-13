## Context

Pinflow cards currently hold only `title` and `description`. The backend uses GORM with glebarez/sqlite, and the frontend is React 19 + TanStack Query. New rich fields (tags, schedule, checklists) require schema changes, new endpoints, and a frontend dialog for editing.

## Goals / Non-Goals

**Goals:**

- Add tags (many-to-many), start/end times, and checklists+items to the card model
- Expose CRUD REST endpoints for all new entities
- Frontend card detail dialog for editing all rich fields
- Seamless DB migration via GORM AutoMigrate

**Non-Goals:**

- Tag color customization (future)
- Recurring schedules or calendar sync
- Checklist ordering drag-and-drop (items use float64 position, but DnD UI is future)
- Real-time collaboration

## Decisions

### D1: Tags as a shared global entity

Tags are stored in a `tags` table and linked to cards via a `card_tags` join table (GORM many-to-many). Tags are global (not board-scoped) for simplicity. Alternative: board-scoped tags — deferred as over-engineering for MVP.

### D2: Checklists are card-owned, items are checklist-owned

`Checklist` belongs to a `Card`; `ChecklistItem` belongs to a `Checklist`. Items have a `completed bool` and a `position float64` for ordering. Alternative: flat task list on card — rejected because users may want multiple distinct checklists (e.g., "Definition of Done", "Review Steps").

### D3: schedule stored as nullable `*time.Time` on Card

`StartTime *time.Time` and `EndTime *time.Time` added to the `Card` model. Nullable avoids sentinel values. SQLite stores as RFC3339 text via GORM's default behavior.

### D4: Card detail dialog in frontend (not inline edit)

A modal `CardDetailDialog` component handles all rich-field editing. The existing card title/description quick-edit stays inline. This avoids cluttering the board card UI. Dialog opens on clicking a "detail" icon or card title.

### D5: API surface

```
GET/POST   /api/cards/:id/tags            attach or list tags
DELETE     /api/cards/:id/tags/:tagId     detach tag
GET/POST   /api/tags                      list/create global tags
GET/POST   /api/cards/:id/checklists      list/create checklists
DELETE     /api/checklists/:id            delete checklist
POST       /api/checklists/:id/items      create item
PATCH      /api/checklist-items/:id       update item (text, completed, position)
DELETE     /api/checklist-items/:id       delete item
PATCH      /api/cards/:id                 already exists; now accepts startTime, endTime
```

### D6: DTO expansion

`CardResponse` gains `Tags []TagResponse`, `StartTime *time.Time`, `EndTime *time.Time`, `Checklists []ChecklistResponse`. `ChecklistResponse` includes `Items []ChecklistItemResponse`.

## Risks / Trade-offs

- **Migration on existing DB**: GORM AutoMigrate adds columns/tables non-destructively; existing data is safe. Rollback requires manual column drops (SQLite has limited ALTER TABLE — columns can be added but not easily removed; acceptable for dev phase).
- **N+1 on card list**: Preloading Tags and Checklists on every card list response increases query cost. Mitigation: preload only in card detail endpoint; board list response omits checklists (only returns counts or omits entirely).
- **Tag name collisions**: Two users could create duplicate tag names. Mitigation: unique index on `tag.name`; return existing tag on conflict.
