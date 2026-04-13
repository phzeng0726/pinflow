## MODIFIED Requirements

### Requirement: Card response DTO includes rich fields

The card response DTO SHALL include `tags`, `startTime`, `endTime`, and `checklists` fields in addition to existing fields (`id`, `title`, `description`, `position`, `columnId`, `isPinned`, `createdAt`, `updatedAt`).

#### Scenario: Card detail endpoint returns rich fields

- **WHEN** user fetches GET /api/cards/:id
- **THEN** response includes `tags: []`, `startTime: null|string`, `endTime: null|string`, `checklists: []`

#### Scenario: Board card list omits heavy nested data

- **WHEN** user fetches GET /api/boards/:id/cards or GET /api/columns/:id/cards
- **THEN** response MAY omit checklist item details but MUST include tag list and schedule fields to support filtering and display

### Requirement: Card update accepts schedule fields

The card PATCH endpoint SHALL accept `startTime` and `endTime` as optional nullable datetime strings in the update request body.

#### Scenario: Update with schedule

- **WHEN** user sends PATCH /api/cards/:id with schedule fields
- **THEN** system persists and returns updated schedule alongside other card fields
