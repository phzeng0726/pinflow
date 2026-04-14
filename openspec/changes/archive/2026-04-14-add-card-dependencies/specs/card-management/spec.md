## MODIFIED Requirements

### Requirement: Card response DTO includes rich fields
The card response DTO SHALL include `tags`, `startTime`, `endTime`, `checklists`, and `dependencyCount` fields in addition to existing fields (`id`, `title`, `description`, `position`, `columnId`, `isPinned`, `createdAt`, `updatedAt`).

#### Scenario: Card detail endpoint returns rich fields
- **WHEN** user fetches GET /api/cards/:id
- **THEN** response includes `tags: []`, `startTime: null|string`, `endTime: null|string`, `checklists: []`, `dependencyCount: number`

#### Scenario: Board card list includes dependency count
- **WHEN** user fetches GET /api/boards/:id (which includes cards)
- **THEN** each card in the response includes `dependencyCount` reflecting the current number of dependencies involving that card

#### Scenario: Board card list omits heavy nested data
- **WHEN** user fetches GET /api/boards/:id/cards or GET /api/columns/:id/cards
- **THEN** response MAY omit checklist item details but MUST include tag list and schedule fields to support filtering and display
