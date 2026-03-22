## MODIFIED Requirements

### Requirement: Card response DTO includes rich fields
The card response DTO SHALL include `tags`, `start_time`, `end_time`, and `checklists` fields in addition to existing fields (`id`, `title`, `description`, `position`, `column_id`, `is_pinned`, `created_at`, `updated_at`).

#### Scenario: Card detail endpoint returns rich fields
- **WHEN** user fetches GET /api/cards/:id
- **THEN** response includes `tags: []`, `start_time: null|string`, `end_time: null|string`, `checklists: []`

#### Scenario: Board card list omits heavy nested data
- **WHEN** user fetches GET /api/boards/:id/cards or GET /api/columns/:id/cards
- **THEN** response MAY omit checklist item details but MUST include tag list and schedule fields to support filtering and display

### Requirement: Card update accepts schedule fields
The card PATCH endpoint SHALL accept `start_time` and `end_time` as optional nullable datetime strings in the update request body.

#### Scenario: Update with schedule
- **WHEN** user sends PATCH /api/cards/:id with schedule fields
- **THEN** system persists and returns updated schedule alongside other card fields
