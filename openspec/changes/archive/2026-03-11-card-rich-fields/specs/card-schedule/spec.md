## ADDED Requirements

### Requirement: Card schedule fields

The system SHALL support optional `startTime` and `endTime` datetime fields on a card. Both fields are nullable. Values MUST be stored and returned in RFC3339 format.

#### Scenario: Set schedule on card update

- **WHEN** user sends PATCH /api/cards/:id with `{"startTime": "2026-03-15T09:00:00Z", "endTime": "2026-03-15T17:00:00Z"}`
- **THEN** system persists both values and returns them in the card response

#### Scenario: Clear schedule

- **WHEN** user sends PATCH /api/cards/:id with `{"startTime": null, "endTime": null}`
- **THEN** system sets both fields to null and response omits or nulls them

#### Scenario: Card without schedule

- **WHEN** a card has no schedule set
- **THEN** card response returns `"startTime": null, "endTime": null`

### Requirement: Schedule validation

The system SHALL reject updates where `endTime` is earlier than `startTime`.

#### Scenario: Invalid range

- **WHEN** user sends PATCH with endTime before startTime
- **THEN** system returns HTTP 400 with an error message
