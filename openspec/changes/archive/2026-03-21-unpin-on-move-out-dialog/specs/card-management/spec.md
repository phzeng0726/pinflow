## MODIFIED Requirements

### Requirement: Card response DTO includes rich fields

The card response DTO SHALL include `tags`, `startTime`, `endTime`, and `checklists` fields in addition to existing fields (`id`, `title`, `description`, `position`, `columnId`, `isPinned`, `createdAt`, `updatedAt`).

#### Scenario: Card detail endpoint returns rich fields

- **WHEN** user fetches GET /api/cards/:id
- **THEN** response includes `tags: []`, `startTime: null|string`, `endTime: null|string`, `checklists: []`

#### Scenario: Board card list omits heavy nested data

- **WHEN** user fetches GET /api/boards/:id/cards or GET /api/columns/:id/cards
- **THEN** response MAY omit checklist item details but MUST include tag list and schedule fields to support filtering and display

### Requirement: Card move flow intercepts auto-pin column exit

當卡片從 `autoPin: true` 的 column 移出時，前端 SHALL 偵測此情境並在 move 完成後觸發取消釘選確認流程（見 move-out-unpin-dialog spec）。

#### Scenario: 移出自動釘選 column 觸發後續確認流程

- **WHEN** moveCard mutation 成功，且來源 column 的 `autoPin` 為 true，且卡片 `isPinned` 為 true
- **THEN** 前端觸發 move-out-unpin-dialog 確認 dialog
